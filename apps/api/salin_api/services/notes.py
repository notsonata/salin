from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Protocol

import httpx


@dataclass(slots=True)
class NotesTranscriptSegment:
    start_ms: int
    end_ms: int
    speaker_label: str
    text: str


@dataclass(slots=True)
class NotesGenerationRequest:
    recording_id: str
    filename: str
    language: str
    transcript_segments: list[NotesTranscriptSegment]


@dataclass(slots=True)
class NotesGenerationResult:
    summary: str
    key_points: list[str]
    decisions: list[str]
    action_items: list[str]
    questions: list[str]
    source_provider: str


class NotesProvider(Protocol):
    def generate_notes(self, *, request: NotesGenerationRequest) -> NotesGenerationResult: ...


class OpenRouterNotesProvider:
    def __init__(self, *, api_key: str, models: str) -> None:
        self.api_key = api_key
        self.models = [model.strip() for model in models.split(",") if model.strip()]

    def generate_notes(self, *, request: NotesGenerationRequest) -> NotesGenerationResult:
        if not self.api_key:
            raise RuntimeError("OPENROUTER_API_KEY is not configured.")
        if not self.models:
            raise RuntimeError("OPENROUTER_MODELS is not configured.")

        last_error: Exception | None = None
        for model_name in self.models:
            try:
                payload = self._request_notes(request=request, model_name=model_name)
                return NotesGenerationResult(
                    summary=self._normalize_string(payload.get("summary")),
                    key_points=self._normalize_list(payload.get("key_points")),
                    decisions=self._normalize_list(payload.get("decisions")),
                    action_items=self._normalize_list(payload.get("action_items")),
                    questions=self._normalize_list(payload.get("questions")),
                    source_provider=f"openrouter:{model_name}",
                )
            except Exception as exc:  # pragma: no cover - exercised through provider integration
                last_error = exc

        assert last_error is not None
        raise RuntimeError(
            f"OpenRouter notes generation failed for all configured models: {last_error}"
        ) from last_error

    def _request_notes(self, *, request: NotesGenerationRequest, model_name: str) -> dict:
        with httpx.Client(
            base_url="https://openrouter.ai/api/v1",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            timeout=90.0,
        ) as client:
            response = client.post(
                "/chat/completions",
                json={
                    "model": model_name,
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You generate structured notes from transcript data only. "
                                "Return strict JSON with keys: summary, key_points, decisions, "
                                "action_items, questions. summary must be a string. The other "
                                "keys must be arrays of strings."
                            ),
                        },
                        {
                            "role": "user",
                            "content": self._build_prompt(request),
                        },
                    ],
                },
            )
            response.raise_for_status()
        body = response.json()
        content = body["choices"][0]["message"]["content"]
        return self._extract_json_payload(content)

    def _build_prompt(self, request: NotesGenerationRequest) -> str:
        transcript_lines = "\n".join(
            self._format_transcript_line(segment)
            for segment in request.transcript_segments
        )
        return (
            f"Recording ID: {request.recording_id}\n"
            f"Filename: {request.filename}\n"
            f"Language: {request.language}\n\n"
            "Transcript:\n"
            f"{transcript_lines}\n\n"
            "Produce concise, reviewable notes for this recording."
        )

    def _extract_json_payload(self, content: str) -> dict:
        try:
            return json.loads(content)
        except json.JSONDecodeError as exc:
            start = content.find("{")
            end = content.rfind("}")
            if start == -1 or end == -1 or end <= start:
                raise ValueError("OpenRouter returned a non-JSON notes payload.") from exc
            return json.loads(content[start : end + 1])

    def _normalize_list(self, value: object) -> list[str]:
        if not isinstance(value, list):
            raise ValueError("Notes payload fields must be arrays of strings.")
        return [self._normalize_string(entry) for entry in value]

    def _normalize_string(self, value: object) -> str:
        if not isinstance(value, str):
            raise ValueError("Notes payload fields must be strings.")
        return value.strip()

    def _format_timestamp(self, milliseconds: int) -> str:
        total_seconds = max(milliseconds, 0) // 1000
        minutes = total_seconds // 60
        seconds = total_seconds % 60
        return f"{minutes:02d}:{seconds:02d}"

    def _format_transcript_line(self, segment: NotesTranscriptSegment) -> str:
        start = self._format_timestamp(segment.start_ms)
        end = self._format_timestamp(segment.end_ms)
        return f"[{start}-{end}] {segment.speaker_label}: {segment.text}"
