from __future__ import annotations

from pathlib import Path

from faster_whisper import WhisperModel

from salin_worker.providers.base import ProviderSegment, TranscriptionResult


LANGUAGE_MAP = {"tl": "tl", "en": "en", "auto": None}


class FasterWhisperTranscriptionProvider:
    def __init__(self, *, model_name: str) -> None:
        self.model_name = model_name
        self._model: WhisperModel | None = None

    @property
    def model(self) -> WhisperModel:
        if self._model is None:
            self._model = WhisperModel(self.model_name, device="cpu", compute_type="int8")
        return self._model

    def transcribe(
        self,
        *,
        audio_path: Path,
        language: str,
        model_name: str,
    ) -> TranscriptionResult:
        segments, info = self.model.transcribe(
            str(audio_path),
            language=LANGUAGE_MAP.get(language),
            vad_filter=True,
        )
        collected = list(segments)
        raw_payload = {
            "language": info.language,
            "duration": info.duration,
            "segments": [
                {"start": segment.start, "end": segment.end, "text": segment.text}
                for segment in collected
            ],
        }
        normalized = [
            ProviderSegment(
                start_ms=int(segment.start * 1000),
                end_ms=int(segment.end * 1000),
                text=segment.text.strip(),
            )
            for segment in collected
        ]
        return TranscriptionResult(
            source_provider="faster-whisper",
            raw_payload=raw_payload,
            segments=normalized,
        )
