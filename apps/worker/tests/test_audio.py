from __future__ import annotations

import subprocess
from pathlib import Path

from salin_worker.services.audio import AudioNormalizer


def test_audio_normalizer_runs_ffmpeg_without_stdin(monkeypatch, tmp_path: Path) -> None:
    calls: list[dict] = []

    def fake_run(command, **kwargs):
        calls.append({"command": command, "kwargs": kwargs})
        return subprocess.CompletedProcess(command, 0)

    monkeypatch.setattr(subprocess, "run", fake_run)

    source_path = tmp_path / "source.aac"
    destination_path = tmp_path / "audio.wav"
    source_path.write_bytes(b"audio")

    AudioNormalizer().normalize(source_path=source_path, destination_path=destination_path)

    assert calls == [
        {
            "command": [
                "ffmpeg",
                "-nostdin",
                "-y",
                "-i",
                str(source_path),
                "-ac",
                "1",
                "-ar",
                "16000",
                str(destination_path),
            ],
            "kwargs": {
                "check": True,
                "capture_output": True,
                "stdin": subprocess.DEVNULL,
            },
        }
    ]
