from __future__ import annotations

import re
import shutil
import tempfile
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


@dataclass(frozen=True, slots=True)
class _YouTubeDownloadStrategy:
    extractor_args: dict[str, dict[str, list[str]]]
    use_cookies: bool


class YouTubeAudioImporter:
    def __init__(
        self,
        *,
        max_duration_seconds: int,
        cookies_file: str | Path | None = None,
        user_agent: str | None = None,
        pot_provider_url: str | None = None,
    ) -> None:
        self.max_duration_seconds = max_duration_seconds
        self.cookies_file = Path(cookies_file).expanduser() if cookies_file else None
        self.user_agent = user_agent.strip() if user_agent else ""
        self.pot_provider_url = pot_provider_url.strip().rstrip("/") if pot_provider_url else ""

    def download_audio(self, *, url: str, output_dir: Path) -> YouTubeImportedAudio:
        try:
            from yt_dlp import YoutubeDL
            from yt_dlp.utils import DownloadError
        except ImportError as exc:  # pragma: no cover - depends on runtime packaging
            raise RuntimeError(
                "yt-dlp is required for YouTube imports. Install worker dependencies first."
            ) from exc

        output_dir.mkdir(parents=True, exist_ok=True)
        if self.cookies_file is not None and not self.cookies_file.is_file():
            raise RuntimeError(
                "YouTube cookies file is configured but was not found. "
                "Export cookies.txt and mount it at the path in YOUTUBE_COOKIES_FILE."
            )

        base_options = {
            "outtmpl": str(output_dir / "source.%(ext)s"),
            "noplaylist": True,
            "quiet": True,
            "no_warnings": True,
            "retries": 2,
            "fragment_retries": 2,
            "socket_timeout": 30,
            "js_runtimes": {"deno": {}},
            "match_filter": self._validate_before_download,
        }
        if self.user_agent:
            base_options["http_headers"] = {
                "User-Agent": self.user_agent,
                "Accept-Language": "en-US,en;q=0.9",
            }

        info: dict[str, Any] | None = None
        last_download_error: DownloadError | None = None
        for strategy in self._download_strategies():
            self._clear_download_candidates(output_dir)
            options = {
                **base_options,
                "extractor_args": strategy.extractor_args,
            }
            staged_cookies_file: Path | None = None
            if strategy.use_cookies:
                staged_cookies_file = self._stage_cookies_file(output_dir)
                options["cookiefile"] = str(staged_cookies_file)

            try:
                with YoutubeDL(options) as downloader:
                    info = downloader.extract_info(url, download=True)
                    self._validate_info(info)
                break
            except DownloadError as exc:
                last_download_error = exc
            finally:
                if staged_cookies_file is not None:
                    staged_cookies_file.unlink(missing_ok=True)
        else:
            if last_download_error is not None:
                if self.cookies_file is not None:
                    raise RuntimeError(
                        "YouTube rejected the configured server session. Export fresh "
                        "Netscape-format cookies from a browser that can play the video, "
                        "replace deploy/secrets/youtube-cookies.txt, and restart the worker."
                    ) from last_download_error
                raise last_download_error
            raise RuntimeError("YouTube audio download did not start.")

        downloaded_path = self._find_downloaded_file(output_dir)
        if info is None:
            raise RuntimeError("YouTube audio download did not return metadata.")
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

    def _validate_before_download(
        self,
        info: dict[str, Any],
        *,
        incomplete: bool = False,
    ) -> None:
        if incomplete:
            return None
        self._validate_info(info)
        return None

    def _download_strategies(self) -> list[_YouTubeDownloadStrategy]:
        strategies: list[_YouTubeDownloadStrategy] = []
        if self.pot_provider_url:
            strategies.append(
                _YouTubeDownloadStrategy(
                    extractor_args={
                        "youtube": {"player_client": ["mweb"]},
                        "youtubepot-bgutilhttp": {
                            "base_url": [self.pot_provider_url],
                        },
                    },
                    use_cookies=False,
                )
            )

        strategies.append(
            _YouTubeDownloadStrategy(
                extractor_args={
                    "youtube": {
                        "player_client": ["android"],
                        "player_skip": ["webpage", "configs"],
                    },
                },
                use_cookies=False,
            )
        )
        if self.cookies_file is not None:
            strategies.append(
                _YouTubeDownloadStrategy(
                    extractor_args={"youtube": {"player_client": ["android"]}},
                    use_cookies=True,
                )
            )
        return strategies

    @staticmethod
    def _duration_seconds(info: dict[str, Any]) -> int | None:
        duration = info.get("duration")
        if duration is None:
            return None
        try:
            return int(float(duration))
        except (TypeError, ValueError):
            return None

    def _stage_cookies_file(self, output_dir: Path) -> Path:
        # yt-dlp rewrites the cookie jar on exit, so mounted secrets need a writable copy.
        with tempfile.NamedTemporaryFile(
            dir=output_dir,
            prefix="youtube-cookies-",
            suffix=".txt",
            delete=False,
        ) as temporary_file:
            staged_path = Path(temporary_file.name)

        shutil.copyfile(self.cookies_file, staged_path)
        return staged_path

    @staticmethod
    def _clear_download_candidates(output_dir: Path) -> None:
        for path in output_dir.iterdir():
            if path.is_file() and path.name.startswith("source."):
                path.unlink(missing_ok=True)

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
            ".mp4": "video/mp4",
            ".ogg": "audio/ogg",
            ".opus": "audio/opus",
            ".wav": "audio/wav",
            ".webm": "audio/webm",
        }.get(suffix.lower(), "application/octet-stream")
