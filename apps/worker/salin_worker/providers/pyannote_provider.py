from __future__ import annotations

import os
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from salin_worker.providers.diarization import DiarizationResult, DiarizationSegment

SOURCE_PROVIDER = "pyannote"


@dataclass(slots=True)
class PyannoteDiarizationProvider:
    auth_token: str
    model_name: str = "pyannote/speaker-diarization-community-1"
    device: str = "auto"
    pipeline: Any | None = None
    audio_loader: Callable[[Path], dict[str, Any]] | None = None

    def __post_init__(self) -> None:
        if self.pipeline is not None:
            return
        if not self.auth_token:
            raise ValueError("PYANNOTE_AUTH_TOKEN is required when diarization uses pyannote.")

        os.environ.setdefault("PYANNOTE_METRICS_ENABLED", "0")
        self.pipeline = self._load_pipeline()

    def diarize(
        self,
        *,
        audio_path: Path,
        speaker_count: str,
    ) -> DiarizationResult:
        assert self.pipeline is not None
        pipeline_options = self._pipeline_options(speaker_count)
        output = self.pipeline(self._load_audio(audio_path), **pipeline_options)
        segments, raw_segments = self._normalize_output(output)
        return DiarizationResult(
            source_provider=SOURCE_PROVIDER,
            raw_payload={
                "provider": SOURCE_PROVIDER,
                "model": self.model_name,
                "speaker_count": speaker_count,
                "segments": raw_segments,
            },
            segments=segments,
        )

    def _load_pipeline(self):
        from pyannote.audio import Pipeline

        try:
            pipeline = Pipeline.from_pretrained(self.model_name, token=self.auth_token)
        except TypeError:
            pipeline = Pipeline.from_pretrained(
                self.model_name,
                use_auth_token=self.auth_token,
            )

        device = self._resolved_device()
        if device is not None:
            pipeline.to(device)
        return pipeline

    def _resolved_device(self):
        import torch

        normalized_device = self.device.strip().lower()
        if normalized_device == "auto":
            if torch.cuda.is_available():
                normalized_device = "cuda"
            elif self._mps_is_available(torch):
                normalized_device = "mps"
            else:
                normalized_device = "cpu"
        if not normalized_device:
            return None
        if normalized_device == "cuda" and not torch.cuda.is_available():
            raise ValueError("PYANNOTE_DEVICE=cuda is unavailable in this runtime.")
        if normalized_device == "mps" and not self._mps_is_available(torch):
            raise ValueError("PYANNOTE_DEVICE=mps is unavailable in this runtime.")
        return torch.device(normalized_device)

    @staticmethod
    def _mps_is_available(torch) -> bool:
        backends = getattr(torch, "backends", None)
        mps_backend = getattr(backends, "mps", None)
        return bool(mps_backend) and bool(mps_backend.is_available())

    def _load_audio(self, audio_path: Path) -> dict[str, Any]:
        if self.audio_loader is not None:
            return self.audio_loader(audio_path)

        import torchaudio

        waveform, sample_rate = torchaudio.load(str(audio_path))
        return {"waveform": waveform, "sample_rate": sample_rate}

    @staticmethod
    def _pipeline_options(speaker_count: str) -> dict[str, int]:
        if speaker_count.isdigit():
            return {"num_speakers": int(speaker_count)}
        return {}

    @staticmethod
    def _normalize_output(output) -> tuple[list[DiarizationSegment], list[dict[str, Any]]]:
        speaker_label_map: dict[str, str] = {}
        normalized_segments: list[DiarizationSegment] = []
        raw_segments: list[dict[str, Any]] = []

        for turn, raw_speaker_label in _iter_pyannote_turns(output):
            start_ms = round(turn.start * 1000)
            end_ms = round(turn.end * 1000)
            if end_ms <= start_ms:
                continue

            raw_label = str(raw_speaker_label)
            speaker_label = speaker_label_map.setdefault(
                raw_label,
                f"Speaker {len(speaker_label_map) + 1}",
            )
            normalized_segments.append(
                DiarizationSegment(
                    start_ms=start_ms,
                    end_ms=end_ms,
                    speaker_label=speaker_label,
                )
            )
            raw_segments.append(
                {
                    "start_ms": start_ms,
                    "end_ms": end_ms,
                    "raw_speaker_label": raw_label,
                    "speaker_label": speaker_label,
                }
            )

        return normalized_segments, raw_segments


def _iter_pyannote_turns(output):
    annotation = getattr(output, "speaker_diarization", output)
    if hasattr(annotation, "itertracks"):
        for turn, _, speaker in annotation.itertracks(yield_label=True):
            yield turn, speaker
        return

    for turn, speaker in annotation:
        yield turn, speaker
