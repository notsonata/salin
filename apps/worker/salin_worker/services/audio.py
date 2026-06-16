from __future__ import annotations

import subprocess
from dataclasses import dataclass
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


@dataclass(frozen=True, slots=True)
class AudioChunk:
    index: int
    path: Path
    start_ms: int
    end_ms: int


class AudioChunker:
    def split(
        self,
        *,
        source_path: Path,
        output_dir: Path,
        chunk_length_ms: int,
        overlap_ms: int,
    ) -> list[AudioChunk]:
        if chunk_length_ms <= 0:
            raise ValueError("Transcription chunk length must be greater than zero.")
        if overlap_ms < 0:
            raise ValueError("Transcription chunk overlap cannot be negative.")
        if overlap_ms >= chunk_length_ms:
            raise ValueError("Transcription chunk overlap must be smaller than chunk length.")

        duration_ms = self.probe_duration_ms(source_path)
        if duration_ms <= chunk_length_ms:
            return [AudioChunk(index=0, path=source_path, start_ms=0, end_ms=duration_ms)]

        chunks_dir = output_dir / "chunks"
        chunks_dir.mkdir(parents=True, exist_ok=True)
        chunks: list[AudioChunk] = []
        step_ms = chunk_length_ms - overlap_ms
        start_ms = 0
        index = 0
        while start_ms < duration_ms:
            end_ms = min(duration_ms, start_ms + chunk_length_ms)
            chunk_path = chunks_dir / f"chunk-{index:04d}.wav"
            self._extract_chunk(
                source_path=source_path,
                destination_path=chunk_path,
                start_ms=start_ms,
                duration_ms=end_ms - start_ms,
            )
            chunks.append(
                AudioChunk(index=index, path=chunk_path, start_ms=start_ms, end_ms=end_ms)
            )
            if end_ms >= duration_ms:
                break
            start_ms += step_ms
            index += 1
        return chunks

    def probe_duration_ms(self, source_path: Path) -> int:
        command = [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(source_path),
        ]
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        duration_seconds = float(result.stdout.strip())
        if duration_seconds <= 0:
            raise ValueError("Could not determine a positive audio duration.")
        return int(round(duration_seconds * 1000))

    def _extract_chunk(
        self,
        *,
        source_path: Path,
        destination_path: Path,
        start_ms: int,
        duration_ms: int,
    ) -> None:
        command = [
            "ffmpeg",
            "-y",
            "-ss",
            f"{start_ms / 1000:.3f}",
            "-i",
            str(source_path),
            "-t",
            f"{duration_ms / 1000:.3f}",
            "-ac",
            "1",
            "-ar",
            "16000",
            str(destination_path),
        ]
        subprocess.run(command, check=True, capture_output=True)
