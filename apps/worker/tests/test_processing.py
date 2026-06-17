from __future__ import annotations

import json
from collections.abc import Callable
from pathlib import Path

from salin_api.core.settings import Settings
from salin_api.db.base import Base
from salin_api.db.session import create_engine_for_url, create_session_factory
from salin_api.recording_sources import YOUTUBE_IMPORT_CONTENT_TYPE, YOUTUBE_IMPORT_KIND
from salin_api.repositories.recordings import RecordingRepository, TranscriptSegmentInput
from salin_api.services.notes import NotesGenerationResult
from salin_worker.providers.base import ProviderSegment, TranscriptionResult
from salin_worker.providers.diarization import DiarizationResult, DiarizationSegment
from salin_worker.services.audio import AudioChunk
from salin_worker.services.processing import RecordingProcessor
from salin_worker.services.youtube import YouTubeImportedAudio


class FakeStorage:
    def __init__(self) -> None:
        self.objects: dict[str, bytes] = {}

    def upload_bytes(self, key: str, payload: bytes, content_type: str) -> None:
        self.objects[key] = payload

    def upload_file(self, key: str, source_path: Path, content_type: str) -> None:
        self.objects[key] = source_path.read_bytes()

    def download_bytes(self, key: str) -> bytes:
        return self.objects[key]

    def download_file(self, key: str, destination_path: Path) -> None:
        destination_path.write_bytes(self.objects[key])

    def presign_get(self, key: str) -> str:
        return f"https://storage.invalid/{key}"


class FakeNormalizer:
    def normalize(self, *, source_path: Path, destination_path: Path) -> Path:
        destination_path.write_bytes(source_path.read_bytes() + b"-normalized")
        return destination_path


class FakeProvider:
    def __init__(
        self,
        *,
        result: TranscriptionResult | None = None,
        results: list[TranscriptionResult] | None = None,
        error: Exception | None = None,
        on_transcribe: Callable[[], None] | None = None,
    ):
        self.result = result
        self.results = results or []
        self.error = error
        self.on_transcribe = on_transcribe
        self.audio_paths: list[Path] = []

    def transcribe(
        self,
        *,
        audio_path: Path,
        language: str,
        model_name: str,
    ) -> TranscriptionResult:
        self.audio_paths.append(audio_path)
        if self.on_transcribe is not None:
            self.on_transcribe()
        if self.error is not None:
            raise self.error
        if self.results:
            return self.results.pop(0)
        assert self.result is not None
        return self.result


class FakeChunker:
    def __init__(self, chunk_ranges: list[tuple[int, int]] | None = None) -> None:
        self.chunk_ranges = chunk_ranges

    def split(
        self,
        *,
        source_path: Path,
        output_dir: Path,
        chunk_length_ms: int,
        overlap_ms: int,
    ) -> list[AudioChunk]:
        if self.chunk_ranges is None:
            return [AudioChunk(index=0, path=source_path, start_ms=0, end_ms=1200)]

        chunks: list[AudioChunk] = []
        for index, (start_ms, end_ms) in enumerate(self.chunk_ranges):
            chunk_path = output_dir / f"fake-chunk-{index}.wav"
            chunk_path.write_bytes(source_path.read_bytes() + f"-chunk-{index}".encode())
            chunks.append(
                AudioChunk(index=index, path=chunk_path, start_ms=start_ms, end_ms=end_ms)
            )
        return chunks


class FakeYouTubeImporter:
    def __init__(
        self,
        *,
        filename: str = "Class-discussion.m4a",
        payload: bytes = b"youtube-audio",
        error: Exception | None = None,
    ) -> None:
        self.filename = filename
        self.payload = payload
        self.error = error
        self.urls: list[str] = []

    def download_audio(self, *, url: str, output_dir: Path) -> YouTubeImportedAudio:
        self.urls.append(url)
        if self.error is not None:
            raise self.error

        output_dir.mkdir(parents=True, exist_ok=True)
        audio_path = output_dir / self.filename
        audio_path.write_bytes(self.payload)
        return YouTubeImportedAudio(
            path=audio_path,
            filename=self.filename,
            content_type="audio/mp4",
            file_size=len(self.payload),
            title="Class discussion",
            duration_seconds=120,
            webpage_url=url,
        )


class FakeNotesProvider:
    def __init__(
        self,
        *,
        result: NotesGenerationResult | None = None,
        error: Exception | None = None,
    ):
        self.result = result
        self.error = error

    def generate_notes(self, *, request) -> dict:
        if self.error is not None:
            raise self.error
        assert self.result is not None
        return self.result


class FakeDiarizationProvider:
    def __init__(
        self,
        *,
        result: DiarizationResult | None = None,
        error: Exception | None = None,
        on_diarize: Callable[[], None] | None = None,
    ):
        self.result = result
        self.error = error
        self.on_diarize = on_diarize

    def diarize(
        self,
        *,
        audio_path: Path,
        speaker_count: str,
    ) -> DiarizationResult:
        if self.on_diarize is not None:
            self.on_diarize()
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


def build_multi_segment_result(source_provider: str) -> TranscriptionResult:
    return TranscriptionResult(
        source_provider=source_provider,
        raw_payload={"provider": source_provider, "segments": [{"text": "A"}, {"text": "B"}]},
        segments=[
            ProviderSegment(start_ms=0, end_ms=1_000, text="Kamusta"),
            ProviderSegment(start_ms=1_000, end_ms=2_000, text="Salamat"),
        ],
    )


def build_segment_result(
    source_provider: str,
    segments: list[tuple[int, int, str]],
) -> TranscriptionResult:
    return TranscriptionResult(
        source_provider=source_provider,
        raw_payload={
            "provider": source_provider,
            "segments": [
                {"start_ms": start_ms, "end_ms": end_ms, "text": text}
                for start_ms, end_ms, text in segments
            ],
        },
        segments=[
            ProviderSegment(start_ms=start_ms, end_ms=end_ms, text=text)
            for start_ms, end_ms, text in segments
        ],
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


def seed_youtube_import(session_factory, storage: FakeStorage) -> str:
    session = session_factory()
    repository = RecordingRepository(session)
    recording_id = "recording-youtube"
    object_key = "recordings/recording-youtube/original/youtube-import.json"
    descriptor = {"kind": YOUTUBE_IMPORT_KIND, "url": "https://youtu.be/demo123"}
    repository.create_recording_with_job(
        recording_id=recording_id,
        filename="YouTube import",
        content_type=YOUTUBE_IMPORT_CONTENT_TYPE,
        file_size=len(json.dumps(descriptor)),
        language="auto",
        processing_mode="accurate",
        speaker_count="auto",
        original_object_key=object_key,
        job_id="job-youtube",
    )
    session.close()
    storage.objects[object_key] = json.dumps(descriptor).encode("utf-8")
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
        audio_chunker=FakeChunker(),
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


def test_processing_imports_youtube_audio_before_transcription(tmp_path: Path) -> None:
    database_url = f"sqlite:///{tmp_path / 'worker-youtube.db'}"
    engine = create_engine_for_url(database_url)
    Base.metadata.create_all(engine)
    session_factory = create_session_factory(database_url)
    storage = FakeStorage()
    recording_id = seed_youtube_import(session_factory, storage)
    youtube_importer = FakeYouTubeImporter()
    processor = RecordingProcessor(
        settings=Settings(DATABASE_URL=database_url),
        storage=storage,
        groq_provider=FakeProvider(result=build_result("groq")),
        local_provider=FakeProvider(result=build_result("faster-whisper")),
        audio_normalizer=FakeNormalizer(),
        audio_chunker=FakeChunker(),
        youtube_importer=youtube_importer,
        session_factory=session_factory,
        groq_retry_delays=(),
    )

    processor.process(recording_id)

    session = session_factory()
    repository = RecordingRepository(session)
    recording = repository.require_recording(recording_id)
    job = repository.require_job(recording_id)
    segments = repository.list_segments(recording_id)
    session.close()

    assert youtube_importer.urls == ["https://youtu.be/demo123"]
    assert recording.filename == "Class-discussion.m4a"
    assert recording.content_type == "audio/mp4"
    assert recording.file_size == len(b"youtube-audio")
    assert recording.original_object_key == (
        "recordings/recording-youtube/original/Class-discussion.m4a"
    )
    assert storage.objects[recording.original_object_key] == b"youtube-audio"
    assert job.stage == "completed"
    assert job.error_message == "Imported YouTube audio before transcription."
    assert segments[0].text == "Kamusta"
    assert "recordings/recording-youtube/artifacts/youtube-import.json" in storage.objects


def test_processing_falls_back_to_local_provider(tmp_path: Path) -> None:
    database_url = f"sqlite:///{tmp_path / 'worker-fallback.db'}"
    engine = create_engine_for_url(database_url)
    Base.metadata.create_all(engine)
    session_factory = create_session_factory(database_url)
    storage = FakeStorage()
    recording_id = seed_recording(session_factory, storage)

    def assert_fallback_status_visible() -> None:
        session = session_factory()
        repository = RecordingRepository(session)
        job = repository.require_job(recording_id)
        session.close()

        assert job.stage == "transcribing"
        assert job.last_provider == "faster-whisper"
        assert job.error_message is not None
        assert "Groq transcription failed" in job.error_message

    processor = RecordingProcessor(
        settings=Settings(DATABASE_URL=database_url),
        storage=storage,
        groq_provider=FakeProvider(error=RuntimeError("Groq unavailable")),
        local_provider=FakeProvider(
            result=build_result("faster-whisper"),
            on_transcribe=assert_fallback_status_visible,
        ),
        audio_normalizer=FakeNormalizer(),
        audio_chunker=FakeChunker(),
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
    assert job.error_message is not None
    assert "Groq transcription failed" in job.error_message
    assert segments[0].source_provider == "faster-whisper"


def test_processing_chunks_long_recording_and_merges_recording_timestamps(
    tmp_path: Path,
) -> None:
    database_url = f"sqlite:///{tmp_path / 'worker-chunks.db'}"
    engine = create_engine_for_url(database_url)
    Base.metadata.create_all(engine)
    session_factory = create_session_factory(database_url)
    storage = FakeStorage()
    recording_id = seed_recording(session_factory, storage)
    progress_messages: list[str | None] = []

    def capture_progress() -> None:
        session = session_factory()
        repository = RecordingRepository(session)
        job = repository.require_job(recording_id)
        progress_messages.append(job.error_message)
        session.close()

    processor = RecordingProcessor(
        settings=Settings(
            DATABASE_URL=database_url,
            TRANSCRIPTION_CHUNK_MINUTES=1,
            TRANSCRIPTION_CHUNK_OVERLAP_SECONDS=10,
        ),
        storage=storage,
        groq_provider=FakeProvider(
            results=[
                build_segment_result(
                    "groq",
                    [
                        (0, 10_000, "Intro"),
                        (20_000, 30_000, "Middle"),
                    ],
                ),
                build_segment_result(
                    "groq",
                    [
                        (5_000, 10_000, "Duplicate overlap"),
                        (15_000, 20_000, "After overlap"),
                    ],
                ),
            ],
            on_transcribe=capture_progress,
        ),
        local_provider=FakeProvider(result=build_result("faster-whisper")),
        audio_normalizer=FakeNormalizer(),
        audio_chunker=FakeChunker([(0, 60_000), (50_000, 110_000)]),
        session_factory=session_factory,
        groq_retry_delays=(),
    )

    processor.process(recording_id)

    session = session_factory()
    repository = RecordingRepository(session)
    job = repository.require_job(recording_id)
    segments = repository.list_segments(recording_id)
    session.close()

    assert progress_messages == ["Transcribing chunk 1/2", "Transcribing chunk 2/2"]
    assert job.stage == "completed"
    assert job.last_provider == "groq"
    assert job.error_message is None
    assert [(segment.start_ms, segment.end_ms, segment.text) for segment in segments] == [
        (0, 10_000, "Intro"),
        (20_000, 30_000, "Middle"),
        (65_000, 70_000, "After overlap"),
    ]
    assert (
        "recordings/recording-1/artifacts/transcription-chunks/chunk-0000-result.json"
        in storage.objects
    )
    assert (
        "recordings/recording-1/artifacts/transcription-chunks/chunk-0001-result.json"
        in storage.objects
    )
    raw_payload = json.loads(
        storage.objects["recordings/recording-1/artifacts/groq-raw.json"].decode("utf-8")
    )
    assert raw_payload["chunked"] is True
    assert raw_payload["chunk_count"] == 2


def test_processing_reuses_cached_transcription_chunks_on_retry(tmp_path: Path) -> None:
    database_url = f"sqlite:///{tmp_path / 'worker-chunk-cache.db'}"
    engine = create_engine_for_url(database_url)
    Base.metadata.create_all(engine)
    session_factory = create_session_factory(database_url)
    storage = FakeStorage()
    recording_id = seed_recording(session_factory, storage)
    storage.objects[
        "recordings/recording-1/artifacts/transcription-chunks/chunk-0000-result.json"
    ] = json.dumps(
        {
            "source_provider": "groq",
            "raw_payload": {"provider": "groq", "cached": True},
            "segments": [{"start_ms": 0, "end_ms": 10_000, "text": "Cached intro"}],
        }
    ).encode("utf-8")
    groq_provider = FakeProvider(
        results=[
            build_segment_result(
                "groq",
                [(15_000, 20_000, "Fresh chunk")],
            )
        ],
    )
    processor = RecordingProcessor(
        settings=Settings(
            DATABASE_URL=database_url,
            TRANSCRIPTION_CHUNK_MINUTES=1,
            TRANSCRIPTION_CHUNK_OVERLAP_SECONDS=10,
        ),
        storage=storage,
        groq_provider=groq_provider,
        local_provider=FakeProvider(result=build_result("faster-whisper")),
        audio_normalizer=FakeNormalizer(),
        audio_chunker=FakeChunker([(0, 60_000), (50_000, 110_000)]),
        session_factory=session_factory,
        groq_retry_delays=(),
    )

    processor.process(recording_id)

    session = session_factory()
    repository = RecordingRepository(session)
    segments = repository.list_segments(recording_id)
    session.close()

    assert len(groq_provider.audio_paths) == 1
    assert groq_provider.audio_paths[0].name == "fake-chunk-1.wav"
    assert [(segment.start_ms, segment.end_ms, segment.text) for segment in segments] == [
        (0, 10_000, "Cached intro"),
        (65_000, 70_000, "Fresh chunk"),
    ]


def test_processing_aligns_diarization_segments_when_provider_is_configured(
    tmp_path: Path,
) -> None:
    database_url = f"sqlite:///{tmp_path / 'worker-diarization.db'}"
    engine = create_engine_for_url(database_url)
    Base.metadata.create_all(engine)
    session_factory = create_session_factory(database_url)
    storage = FakeStorage()
    recording_id = seed_recording(session_factory, storage)

    def assert_transcript_saved_before_diarization() -> None:
        session = session_factory()
        repository = RecordingRepository(session)
        job = repository.require_job(recording_id)
        segments = repository.list_segments(recording_id)
        session.close()

        assert job.stage == "diarizing"
        assert [segment.speaker_label for segment in segments] == ["Speaker", "Speaker"]
        assert [segment.text for segment in segments] == ["Kamusta", "Salamat"]

    processor = RecordingProcessor(
        settings=Settings(DATABASE_URL=database_url),
        storage=storage,
        groq_provider=FakeProvider(result=build_multi_segment_result("groq")),
        local_provider=FakeProvider(result=build_result("faster-whisper")),
        diarization_provider=FakeDiarizationProvider(
            on_diarize=assert_transcript_saved_before_diarization,
            result=DiarizationResult(
                source_provider="test-diarizer",
                raw_payload={"segments": [{"speaker": "Speaker 1"}, {"speaker": "Speaker 2"}]},
                segments=[
                    DiarizationSegment(start_ms=0, end_ms=900, speaker_label="Speaker 1"),
                    DiarizationSegment(start_ms=900, end_ms=2_000, speaker_label="Speaker 2"),
                ],
            )
        ),
        audio_normalizer=FakeNormalizer(),
        audio_chunker=FakeChunker(),
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
    assert [segment.speaker_label for segment in segments] == ["Speaker 1", "Speaker 2"]
    assert all(segment.speaker_estimated for segment in segments)
    assert (
        "recordings/recording-1/artifacts/test-diarizer-diarization-raw.json"
        in storage.objects
    )


def test_processing_keeps_transcript_when_diarization_fails(tmp_path: Path) -> None:
    database_url = f"sqlite:///{tmp_path / 'worker-diarization-failure.db'}"
    engine = create_engine_for_url(database_url)
    Base.metadata.create_all(engine)
    session_factory = create_session_factory(database_url)
    storage = FakeStorage()
    recording_id = seed_recording(session_factory, storage)
    processor = RecordingProcessor(
        settings=Settings(DATABASE_URL=database_url),
        storage=storage,
        groq_provider=FakeProvider(result=build_multi_segment_result("groq")),
        local_provider=FakeProvider(result=build_result("faster-whisper")),
        diarization_provider=FakeDiarizationProvider(error=RuntimeError("Diarizer unavailable")),
        audio_normalizer=FakeNormalizer(),
        audio_chunker=FakeChunker(),
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
    assert job.error_message is not None
    assert "Diarization failed" in job.error_message
    assert [segment.speaker_label for segment in segments] == ["Speaker", "Speaker"]
    assert "recordings/recording-1/artifacts/diarization-error.json" in storage.objects


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
                content="# Summary\n\nSummary text\n\n## Key Points\n\n- Key point",
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
    assert notes.content == "# Summary\n\nSummary text\n\n## Key Points\n\n- Key point"
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
    assert notes.content is None
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
                content="# Summary\n\nFirst summary\n\n## Key Points\n\n- First point",
                source_provider="openrouter:model-a",
            )
        ),
        session_factory=session_factory,
    )
    second_generator = RecordingNotesGenerator(
        settings=Settings(DATABASE_URL=database_url),
        notes_provider=FakeNotesProvider(
            result=NotesGenerationResult(
                content="# Summary\n\nSecond summary\n\n## Key Points\n\n- Second point",
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
    assert notes.content == "# Summary\n\nSecond summary\n\n## Key Points\n\n- Second point"
    assert notes.source_provider == "openrouter:model-b"
    assert notes.generation_count == 2
