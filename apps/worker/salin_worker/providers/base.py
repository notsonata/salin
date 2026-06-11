from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Protocol


@dataclass(slots=True)
class ProviderSegment:
    start_ms: int
    end_ms: int
    text: str


@dataclass(slots=True)
class TranscriptionResult:
    source_provider: str
    raw_payload: dict
    segments: list[ProviderSegment]


class TranscriptionProvider(Protocol):
    def transcribe(
        self,
        *,
        audio_path: Path,
        language: str,
        model_name: str,
    ) -> TranscriptionResult: ...
