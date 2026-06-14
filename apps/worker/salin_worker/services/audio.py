from __future__ import annotations

import subprocess
from pathlib import Path


class AudioNormalizer:
    def normalize(self, *, source_path: Path, destination_path: Path) -> Path:
        command = [
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
        ]
        subprocess.run(
            command,
            check=True,
            capture_output=True,
            stdin=subprocess.DEVNULL,
        )
        return destination_path
