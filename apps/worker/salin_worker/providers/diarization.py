from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Protocol


@dataclass(slots=True)
class DiarizationSegment:
    start_ms: int
    end_ms: int
    speaker_label: str
    confidence: float | None = None


@dataclass(slots=True)
class DiarizationResult:
    source_provider: str
    raw_payload: dict
    segments: list[DiarizationSegment]


class DiarizationProvider(Protocol):
    def diarize(
        self,
        *,
        audio_path: Path,
        speaker_count: str,
    ) -> DiarizationResult: ...
