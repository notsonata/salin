from __future__ import annotations

import json
from pathlib import Path

from salin_api.core.settings import Settings
from salin_api.db.base import Base
from salin_api.db.session import create_engine_for_url, create_session_factory
from salin_api.repositories.recordings import RecordingRepository, TranscriptSegmentInput
from salin_api.services.notes import NotesGenerationResult
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


class FakeNotesProvider:
    def __init__(self, *, result: NotesGenerationResult | None = None, error: Exception | None = None):
        self.result = result
        self.error = error

    def generate_notes(self, *, request) -> dict:
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


def seed_completed_transcript(session_factory, storage: FakeStorage) -> str:
    recording_id = seed_recording(session_factory, storage)
    session = session_factory()
    repository = RecordingRepository(session)
    repository.replace_segments(
        recording_id,
        [
            TranscriptSegmentInput(
                index=0,
                start_ms=0,
                end_ms=1200,
                text="Kamusta sa notes milestone.",
                speaker_label="Speaker",
                speaker_estimated=True,
                source_provider="groq",
            )
        ],
    )
    repository.update_job_stage(
        recording_id,
        stage="completed",
        retryable=False,
        error_message=None,
        last_provider="groq",
    )
    session.close()
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


def test_notes_generation_persists_structured_sections(tmp_path: Path) -> None:
    from salin_worker.services.notes import RecordingNotesGenerator

    database_url = f"sqlite:///{tmp_path / 'worker-notes.db'}"
    engine = create_engine_for_url(database_url)
    Base.metadata.create_all(engine)
    session_factory = create_session_factory(database_url)
    storage = FakeStorage()
    recording_id = seed_completed_transcript(session_factory, storage)
    generator = RecordingNotesGenerator(
        settings=Settings(DATABASE_URL=database_url),
        notes_provider=FakeNotesProvider(
            result=NotesGenerationResult(
                summary="Summary text",
                key_points=["Key point"],
                decisions=["Decision"],
                action_items=["Action item"],
                questions=["Question"],
                source_provider="openrouter:test-model",
            )
        ),
        session_factory=session_factory,
    )

    generator.generate(recording_id)

    session = session_factory()
    repository = RecordingRepository(session)
    notes = repository.require_generated_notes(recording_id)
    session.close()

    assert notes.status == "completed"
    assert notes.summary == "Summary text"
    assert json.loads(notes.key_points_json) == ["Key point"]
    assert json.loads(notes.decisions_json) == ["Decision"]
    assert json.loads(notes.action_items_json) == ["Action item"]
    assert json.loads(notes.questions_json) == ["Question"]
    assert notes.source_provider == "openrouter:test-model"
    assert notes.generation_count == 1


def test_notes_generation_failure_keeps_transcript_intact(tmp_path: Path) -> None:
    from salin_worker.services.notes import RecordingNotesGenerator

    database_url = f"sqlite:///{tmp_path / 'worker-notes-failure.db'}"
    engine = create_engine_for_url(database_url)
    Base.metadata.create_all(engine)
    session_factory = create_session_factory(database_url)
    storage = FakeStorage()
    recording_id = seed_completed_transcript(session_factory, storage)
    generator = RecordingNotesGenerator(
        settings=Settings(DATABASE_URL=database_url),
        notes_provider=FakeNotesProvider(error=RuntimeError("OpenRouter failed")),
        session_factory=session_factory,
    )

    try:
        generator.generate(recording_id)
    except RuntimeError:
        pass

    session = session_factory()
    repository = RecordingRepository(session)
    job = repository.require_job(recording_id)
    segments = repository.list_segments(recording_id)
    notes = repository.require_generated_notes(recording_id)
    session.close()

    assert job.stage == "completed"
    assert len(segments) == 1
    assert notes.status == "failed"
    assert notes.error_message == "OpenRouter failed"
    assert notes.summary is None
    assert notes.generation_count == 0


def test_notes_regeneration_replaces_content_after_success(tmp_path: Path) -> None:
    from salin_worker.services.notes import RecordingNotesGenerator

    database_url = f"sqlite:///{tmp_path / 'worker-notes-regenerate.db'}"
    engine = create_engine_for_url(database_url)
    Base.metadata.create_all(engine)
    session_factory = create_session_factory(database_url)
    storage = FakeStorage()
    recording_id = seed_completed_transcript(session_factory, storage)
    first_generator = RecordingNotesGenerator(
        settings=Settings(DATABASE_URL=database_url),
        notes_provider=FakeNotesProvider(
            result=NotesGenerationResult(
                summary="First summary",
                key_points=["First point"],
                decisions=["First decision"],
                action_items=["First action"],
                questions=["First question"],
                source_provider="openrouter:model-a",
            )
        ),
        session_factory=session_factory,
    )
    second_generator = RecordingNotesGenerator(
        settings=Settings(DATABASE_URL=database_url),
        notes_provider=FakeNotesProvider(
            result=NotesGenerationResult(
                summary="Second summary",
                key_points=["Second point"],
                decisions=["Second decision"],
                action_items=["Second action"],
                questions=["Second question"],
                source_provider="openrouter:model-b",
            )
        ),
        session_factory=session_factory,
    )

    first_generator.generate(recording_id)
    second_generator.generate(recording_id)

    session = session_factory()
    repository = RecordingRepository(session)
    notes = repository.require_generated_notes(recording_id)
    session.close()

    assert notes.status == "completed"
    assert notes.summary == "Second summary"
    assert json.loads(notes.key_points_json) == ["Second point"]
    assert notes.source_provider == "openrouter:model-b"
    assert notes.generation_count == 2
