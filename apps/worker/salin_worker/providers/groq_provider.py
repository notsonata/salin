from __future__ import annotations

from pathlib import Path

from groq import Groq

from salin_worker.providers.base import ProviderSegment, TranscriptionResult


class GroqTranscriptionProvider:
    def __init__(self, *, api_key: str) -> None:
        self.client = Groq(api_key=api_key)

    def transcribe(
        self,
        *,
        audio_path: Path,
        language: str,
        model_name: str,
    ) -> TranscriptionResult:
        with audio_path.open("rb") as handle:
            response = self.client.audio.transcriptions.create(
                file=handle,
                model=model_name,
                language=None if language == "auto" else language,
                response_format="verbose_json",
                timestamp_granularities=["segment"],
                temperature=0.0,
            )

        raw_payload = response.model_dump() if hasattr(response, "model_dump") else dict(response)
        segments = [
            ProviderSegment(
                start_ms=int(segment["start"] * 1000),
                end_ms=int(segment["end"] * 1000),
                text=segment["text"].strip(),
            )
            for segment in raw_payload.get("segments", [])
        ]
        return TranscriptionResult(
            source_provider="groq",
            raw_payload=raw_payload,
            segments=segments,
        )
