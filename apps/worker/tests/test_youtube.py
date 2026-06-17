from __future__ import annotations

import sys
from pathlib import Path
from types import ModuleType
from typing import Any

import pytest
from salin_worker.services.youtube import YouTubeAudioImporter


class FakeYoutubeDL:
    options_seen: list[dict[str, Any]] = []

    def __init__(self, options: dict[str, Any]) -> None:
        self.options = options
        self.options_seen.append(options)

    def __enter__(self) -> FakeYoutubeDL:
        return self

    def __exit__(self, *args: object) -> None:
        return None

    def extract_info(self, url: str, *, download: bool) -> dict[str, Any]:
        assert download is False
        return {
            "id": "demo123",
            "title": "Demo recording",
            "duration": 60,
            "webpage_url": url,
        }

    def download(self, urls: list[str]) -> None:
        assert urls == ["https://www.youtube.com/watch?v=demo123"]
        output_path = Path(str(self.options["outtmpl"]).replace("%(ext)s", "m4a"))
        output_path.write_bytes(b"youtube-audio")
        cookiefile = self.options.get("cookiefile")
        if cookiefile:
            Path(cookiefile).write_text("# updated cookies\n", encoding="utf-8")


@pytest.fixture(autouse=True)
def fake_yt_dlp(monkeypatch: pytest.MonkeyPatch) -> None:
    FakeYoutubeDL.options_seen = []
    module = ModuleType("yt_dlp")
    module.YoutubeDL = FakeYoutubeDL
    monkeypatch.setitem(sys.modules, "yt_dlp", module)


def test_youtube_importer_stages_cookie_file_for_yt_dlp(tmp_path: Path) -> None:
    cookies_file = tmp_path / "youtube-cookies.txt"
    cookies_file.write_text("# Netscape HTTP Cookie File\n", encoding="utf-8")
    importer = YouTubeAudioImporter(
        max_duration_seconds=120,
        cookies_file=cookies_file,
    )

    imported_audio = importer.download_audio(
        url="https://www.youtube.com/watch?v=demo123",
        output_dir=tmp_path / "download",
    )

    staged_cookiefile = Path(FakeYoutubeDL.options_seen[0]["cookiefile"])
    assert staged_cookiefile != cookies_file
    assert not staged_cookiefile.exists()
    assert imported_audio.filename == "Demo-recording.m4a"
    assert imported_audio.file_size == len(b"youtube-audio")


def test_youtube_importer_handles_read_only_cookie_mount(tmp_path: Path) -> None:
    cookies_file = tmp_path / "youtube-cookies.txt"
    cookies_file.write_text("# Netscape HTTP Cookie File\n", encoding="utf-8")
    cookies_file.chmod(0o400)
    importer = YouTubeAudioImporter(
        max_duration_seconds=120,
        cookies_file=cookies_file,
    )

    imported_audio = importer.download_audio(
        url="https://www.youtube.com/watch?v=demo123",
        output_dir=tmp_path / "download",
    )

    staged_cookiefile = Path(FakeYoutubeDL.options_seen[0]["cookiefile"])
    assert staged_cookiefile != cookies_file
    assert not staged_cookiefile.exists()
    assert imported_audio.file_size == len(b"youtube-audio")


def test_youtube_importer_fails_clearly_when_cookie_file_is_missing(
    tmp_path: Path,
) -> None:
    importer = YouTubeAudioImporter(
        max_duration_seconds=120,
        cookies_file=tmp_path / "missing-cookies.txt",
    )

    with pytest.raises(RuntimeError, match="YouTube cookies file"):
        importer.download_audio(
            url="https://www.youtube.com/watch?v=demo123",
            output_dir=tmp_path / "download",
        )
