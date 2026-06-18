from __future__ import annotations

import sys
from pathlib import Path
from types import ModuleType
from typing import Any

import pytest
from salin_worker.services.youtube import YouTubeAudioImporter


class FakeDownloadError(Exception):
    pass


class FakeYoutubeDL:
    options_seen: list[dict[str, Any]] = []
    download_flags_seen: list[bool] = []
    download_calls_seen: list[list[str]] = []
    fail_without_cookiefile = False
    always_fail = False

    def __init__(self, options: dict[str, Any]) -> None:
        self.options = options
        self.options_seen.append(options)

    def __enter__(self) -> FakeYoutubeDL:
        return self

    def __exit__(self, *args: object) -> None:
        return None

    def extract_info(self, url: str, *, download: bool) -> dict[str, Any]:
        self.download_flags_seen.append(download)
        if self.always_fail:
            raise FakeDownloadError("bot check")
        if self.fail_without_cookiefile and not self.options.get("cookiefile"):
            raise FakeDownloadError("bot check")
        info = {
            "id": "demo123",
            "title": "Demo recording",
            "duration": 60,
            "webpage_url": url,
        }
        match_filter = self.options.get("match_filter")
        if match_filter is not None:
            match_filter(info, incomplete=False)
        if download:
            output_path = Path(str(self.options["outtmpl"]).replace("%(ext)s", "m4a"))
            output_path.write_bytes(b"youtube-audio")
        return info

    def download(self, urls: list[str]) -> None:
        self.download_calls_seen.append(urls)
        assert urls == ["https://www.youtube.com/watch?v=demo123"]
        output_path = Path(str(self.options["outtmpl"]).replace("%(ext)s", "m4a"))
        output_path.write_bytes(b"youtube-audio")
        cookiefile = self.options.get("cookiefile")
        if cookiefile:
            Path(cookiefile).write_text("# updated cookies\n", encoding="utf-8")


@pytest.fixture(autouse=True)
def fake_yt_dlp(monkeypatch: pytest.MonkeyPatch) -> None:
    FakeYoutubeDL.options_seen = []
    FakeYoutubeDL.download_flags_seen = []
    FakeYoutubeDL.download_calls_seen = []
    FakeYoutubeDL.fail_without_cookiefile = False
    FakeYoutubeDL.always_fail = False
    module = ModuleType("yt_dlp")
    module.YoutubeDL = FakeYoutubeDL
    monkeypatch.setitem(sys.modules, "yt_dlp", module)
    utils_module = ModuleType("yt_dlp.utils")
    utils_module.DownloadError = FakeDownloadError
    monkeypatch.setitem(sys.modules, "yt_dlp.utils", utils_module)


def test_youtube_importer_stages_cookie_file_for_yt_dlp(tmp_path: Path) -> None:
    FakeYoutubeDL.fail_without_cookiefile = True
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

    staged_cookiefile = Path(FakeYoutubeDL.options_seen[1]["cookiefile"])
    assert staged_cookiefile != cookies_file
    assert not staged_cookiefile.exists()
    assert imported_audio.filename == "Demo-recording.m4a"
    assert imported_audio.file_size == len(b"youtube-audio")


def test_youtube_importer_handles_read_only_cookie_mount(tmp_path: Path) -> None:
    FakeYoutubeDL.fail_without_cookiefile = True
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

    staged_cookiefile = Path(FakeYoutubeDL.options_seen[1]["cookiefile"])
    assert staged_cookiefile != cookies_file
    assert not staged_cookiefile.exists()
    assert imported_audio.file_size == len(b"youtube-audio")


def test_youtube_importer_enables_deno_runtime_for_yt_dlp(tmp_path: Path) -> None:
    importer = YouTubeAudioImporter(max_duration_seconds=120)

    importer.download_audio(
        url="https://www.youtube.com/watch?v=demo123",
        output_dir=tmp_path / "download",
    )

    assert FakeYoutubeDL.options_seen[0]["js_runtimes"] == {"deno": {}}


def test_youtube_importer_uses_configured_user_agent(tmp_path: Path) -> None:
    importer = YouTubeAudioImporter(
        max_duration_seconds=120,
        user_agent="Mozilla/5.0 SalinDemo",
    )

    importer.download_audio(
        url="https://www.youtube.com/watch?v=demo123",
        output_dir=tmp_path / "download",
    )

    assert FakeYoutubeDL.options_seen[0]["http_headers"]["User-Agent"] == (
        "Mozilla/5.0 SalinDemo"
    )


def test_youtube_importer_tries_pot_provider_strategy_first(tmp_path: Path) -> None:
    importer = YouTubeAudioImporter(
        max_duration_seconds=120,
        pot_provider_url="http://pot-provider:4416",
    )

    importer.download_audio(
        url="https://www.youtube.com/watch?v=demo123",
        output_dir=tmp_path / "download",
    )

    assert FakeYoutubeDL.options_seen[0]["extractor_args"] == {
        "youtube": {"player_client": ["mweb"]},
        "youtubepot-bgutilhttp": {"base_url": ["http://pot-provider:4416"]},
    }


def test_youtube_importer_uses_android_client_for_bot_check_recovery(
    tmp_path: Path,
) -> None:
    importer = YouTubeAudioImporter(max_duration_seconds=120)

    importer.download_audio(
        url="https://www.youtube.com/watch?v=demo123",
        output_dir=tmp_path / "download",
    )

    assert FakeYoutubeDL.options_seen[0]["extractor_args"] == {
        "youtube": {
            "player_client": ["android"],
            "player_skip": ["webpage", "configs"],
        },
    }


def test_youtube_importer_lets_yt_dlp_pick_available_format(
    tmp_path: Path,
) -> None:
    importer = YouTubeAudioImporter(max_duration_seconds=120)

    importer.download_audio(
        url="https://www.youtube.com/watch?v=demo123",
        output_dir=tmp_path / "download",
    )

    assert "format" not in FakeYoutubeDL.options_seen[0]


def test_youtube_importer_downloads_with_one_extraction_pass(tmp_path: Path) -> None:
    importer = YouTubeAudioImporter(max_duration_seconds=120)

    importer.download_audio(
        url="https://www.youtube.com/watch?v=demo123",
        output_dir=tmp_path / "download",
    )

    assert FakeYoutubeDL.download_flags_seen == [True]
    assert FakeYoutubeDL.download_calls_seen == []


def test_youtube_importer_validates_duration_before_download(
    tmp_path: Path,
) -> None:
    importer = YouTubeAudioImporter(max_duration_seconds=30)

    with pytest.raises(ValueError, match="limited to 1 minutes"):
        importer.download_audio(
            url="https://www.youtube.com/watch?v=demo123",
            output_dir=tmp_path / "download",
        )

    assert not (tmp_path / "download" / "source.m4a").exists()


def test_youtube_importer_uses_video_mp4_content_type_for_mp4_downloads() -> None:
    assert YouTubeAudioImporter._content_type(".mp4") == "video/mp4"


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


def test_youtube_importer_explains_stale_cookies_after_bot_check(
    tmp_path: Path,
) -> None:
    FakeYoutubeDL.always_fail = True
    cookies_file = tmp_path / "youtube-cookies.txt"
    cookies_file.write_text("# Netscape HTTP Cookie File\n", encoding="utf-8")
    importer = YouTubeAudioImporter(
        max_duration_seconds=120,
        cookies_file=cookies_file,
    )

    with pytest.raises(RuntimeError, match="fresh Netscape-format cookies"):
        importer.download_audio(
            url="https://www.youtube.com/watch?v=demo123",
            output_dir=tmp_path / "download",
        )
