from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True, slots=True)
class YouTubeImportedAudio:
    path: Path
    filename: str
    content_type: str
    file_size: int
    title: str
    duration_seconds: int | None
    webpage_url: str


class YouTubeAudioImporter:
    def __init__(self, *, max_duration_seconds: int) -> None:
        self.max_duration_seconds = max_duration_seconds

    def download_audio(self, *, url: str, output_dir: Path) -> YouTubeImportedAudio:
        try:
            from yt_dlp import YoutubeDL
        except ImportError as exc:  # pragma: no cover - depends on runtime packaging
            raise RuntimeError(
                "yt-dlp is required for YouTube imports. Install worker dependencies first."
            ) from exc

        output_dir.mkdir(parents=True, exist_ok=True)
        options = {
            "format": "bestaudio/best",
            "outtmpl": str(output_dir / "source.%(ext)s"),
            "noplaylist": True,
            "quiet": True,
            "no_warnings": True,
            "retries": 2,
            "fragment_retries": 2,
            "socket_timeout": 30,
        }
        with YoutubeDL(options) as downloader:
            info = downloader.extract_info(url, download=False)
            self._validate_info(info)
            downloader.download([url])

        downloaded_path = self._find_downloaded_file(output_dir)
        title = str(info.get("title") or info.get("id") or "youtube-recording").strip()
        duration = self._duration_seconds(info)
        filename = self._safe_filename(title, downloaded_path.suffix)
        return YouTubeImportedAudio(
            path=downloaded_path,
            filename=filename,
            content_type=self._content_type(downloaded_path.suffix),
            file_size=downloaded_path.stat().st_size,
            title=title,
            duration_seconds=duration,
            webpage_url=str(info.get("webpage_url") or url),
        )

    def _validate_info(self, info: dict[str, Any]) -> None:
        if info.get("_type") == "playlist":
            raise ValueError("Paste a single YouTube video link, not a playlist.")

        duration = self._duration_seconds(info)
        if duration is not None and duration > self.max_duration_seconds:
            limit_minutes = max(1, self.max_duration_seconds // 60)
            raise ValueError(
                f"YouTube imports are limited to {limit_minutes} minutes for this demo."
            )

    @staticmethod
    def _duration_seconds(info: dict[str, Any]) -> int | None:
        duration = info.get("duration")
        if duration is None:
            return None
        try:
            return int(float(duration))
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _find_downloaded_file(output_dir: Path) -> Path:
        candidates = [
            path
            for path in output_dir.iterdir()
            if path.is_file()
            and path.name.startswith("source.")
            and path.suffix not in {".part", ".ytdl"}
        ]
        if not candidates:
            raise RuntimeError("YouTube audio download did not produce a usable file.")
        return max(candidates, key=lambda path: path.stat().st_mtime)

    @staticmethod
    def _safe_filename(title: str, suffix: str) -> str:
        normalized_title = unicodedata.normalize("NFKD", title)
        ascii_title = normalized_title.encode("ascii", "ignore").decode("ascii")
        safe_stem = re.sub(r"[^A-Za-z0-9._-]+", "-", ascii_title).strip(".-_")
        safe_stem = safe_stem[:80].strip(".-_") or "youtube-recording"
        safe_suffix = suffix.lower() if suffix.startswith(".") else f".{suffix.lower()}"
        if safe_suffix == ".":
            safe_suffix = ".audio"
        return f"{safe_stem}{safe_suffix}"

    @staticmethod
    def _content_type(suffix: str) -> str:
        return {
            ".aac": "audio/aac",
            ".m4a": "audio/mp4",
            ".mp3": "audio/mpeg",
            ".ogg": "audio/ogg",
            ".opus": "audio/opus",
            ".wav": "audio/wav",
            ".webm": "audio/webm",
        }.get(suffix.lower(), "application/octet-stream")
