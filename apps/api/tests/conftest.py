from __future__ import annotations

from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from salin_api.core.container import ApiServices
from salin_api.core.settings import Settings
from salin_api.main import create_app


class FakeStorage:
    def __init__(self) -> None:
        self.objects: dict[str, bytes] = {}

    def upload_bytes(self, key: str, payload: bytes, content_type: str) -> None:
        self.objects[key] = payload

    def upload_file(self, key: str, source_path: Path, content_type: str) -> None:
        self.objects[key] = source_path.read_bytes()

    def download_file(self, key: str, destination_path: Path) -> None:
        destination_path.write_bytes(self.objects[key])

    def presign_get(self, key: str) -> str:
        return f"https://storage.invalid/{key}"


class FakeQueue:
    def __init__(self) -> None:
        self.enqueued_recordings: list[str] = []
        self.enqueued_notes: list[str] = []

    def enqueue_recording(self, recording_id: str) -> None:
        self.enqueued_recordings.append(recording_id)

    def enqueue_notes(self, recording_id: str) -> None:
        self.enqueued_notes.append(recording_id)


class FakeNotesProvider:
    def generate_notes(self, *, request) -> dict:
        return {
            "summary": "Generated summary",
            "key_points": ["Point one"],
            "decisions": ["Decision one"],
            "action_items": ["Action one"],
            "questions": ["Question one"],
            "source_provider": "fake-notes",
        }


@pytest.fixture()
def app(tmp_path: Path):
    database_path = tmp_path / "salin-test.db"
    settings = Settings(
        DATABASE_URL=f"sqlite:///{database_path}",
        REDIS_URL="redis://localhost:6379/0",
        R2_BUCKET_NAME="test-bucket",
        MAX_UPLOAD_MB=5,
    )
    services = ApiServices(
        storage=FakeStorage(),
        job_queue=FakeQueue(),
        notes_provider=FakeNotesProvider(),
    )
    return create_app(settings=settings, services=services)


@pytest.fixture()
def client(app) -> Generator[TestClient, None, None]:
    with TestClient(app) as test_client:
        yield test_client
