from __future__ import annotations

import json
from pathlib import Path

from salin_api.core.settings import Settings
from salin_api.db.base import Base
from salin_api.db.session import create_engine_for_url, create_session_factory
from salin_api.repositories.recordings import RecordingRepository
from salin_worker.providers.base import ProviderSegment, TranscriptionResult
from salin_worker.services.processing import RecordingProcessor


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


class FakeNormalizer:
    def normalize(self, *, source_path: Path, destination_path: Path) -> Path:
        destination_path.write_bytes(source_path.read_bytes() + b"-normalized")
        return destination_path


class FakeProvider:
    def __init__(self, *, result: TranscriptionResult | None = None, error: Exception | None = None):
        self.result = result
        self.error = error

    def transcribe(self, *, audio_path: Path, language: str, model_name: str) -> TranscriptionResult:
        if self.error is not None:
            raise self.error
        assert self.result is not None
        return self.result


def build_result(source_provider: str) -> TranscriptionResult:
    return TranscriptionResult(
        source_provider=source_provider,
        raw_payload={"provider": source_provider, "segments": [{"text": "Kamusta"}]},
        segments=[ProviderSegment(start_ms=0, end_ms=1200, text="Kamusta")],
    )


def seed_recording(session_factory, storage: FakeStorage) -> str:
    session = session_factory()
    repository = RecordingRepository(session)
    recording_id = "recording-1"
    repository.create_recording_with_job(
        recording_id=recording_id,
        filename="lecture.mp3",
        content_type="audio/mpeg",
        file_size=10,
        language="auto",
        processing_mode="accurate",
        speaker_count="auto",
        original_object_key="recordings/recording-1/original/lecture.mp3",
        job_id="job-1",
    )
    session.close()
    storage.objects["recordings/recording-1/original/lecture.mp3"] = b"fake-audio"
    return recording_id


def test_processing_persists_canonical_segments_from_groq(tmp_path: Path) -> None:
    database_url = f"sqlite:///{tmp_path / 'worker-groq.db'}"
    engine = create_engine_for_url(database_url)
    Base.metadata.create_all(engine)
    session_factory = create_session_factory(database_url)
    storage = FakeStorage()
    recording_id = seed_recording(session_factory, storage)
    processor = RecordingProcessor(
        settings=Settings(DATABASE_URL=database_url),
        storage=storage,
        groq_provider=FakeProvider(result=build_result("groq")),
        local_provider=FakeProvider(result=build_result("faster-whisper")),
        audio_normalizer=FakeNormalizer(),
        session_factory=session_factory,
        groq_retry_delays=(),
    )

    processor.process(recording_id)

    session = session_factory()
    repository = RecordingRepository(session)
    job = repository.require_job(recording_id)
    segments = repository.list_segments(recording_id)
    session.close()

    assert job.stage == "completed"
    assert job.last_provider == "groq"
    assert len(segments) == 1
    assert segments[0].speaker_label == "Speaker"
    assert segments[0].speaker_estimated is True
    assert json.loads(
        storage.objects["recordings/recording-1/artifacts/groq-raw.json"].decode("utf-8")
    )["provider"] == "groq"


def test_processing_falls_back_to_local_provider(tmp_path: Path) -> None:
    database_url = f"sqlite:///{tmp_path / 'worker-fallback.db'}"
    engine = create_engine_for_url(database_url)
    Base.metadata.create_all(engine)
    session_factory = create_session_factory(database_url)
    storage = FakeStorage()
    recording_id = seed_recording(session_factory, storage)
    processor = RecordingProcessor(
        settings=Settings(DATABASE_URL=database_url),
        storage=storage,
        groq_provider=FakeProvider(error=RuntimeError("Groq unavailable")),
        local_provider=FakeProvider(result=build_result("faster-whisper")),
        audio_normalizer=FakeNormalizer(),
        session_factory=session_factory,
        groq_retry_delays=(),
    )

    processor.process(recording_id)

    session = session_factory()
    repository = RecordingRepository(session)
    job = repository.require_job(recording_id)
    segments = repository.list_segments(recording_id)
    session.close()

    assert job.stage == "completed"
    assert job.last_provider == "faster-whisper"
    assert segments[0].source_provider == "faster-whisper"
