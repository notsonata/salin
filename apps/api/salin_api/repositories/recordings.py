from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from salin_api.models import GeneratedNotes, ProcessingJob, Recording, TranscriptSegment


@dataclass(slots=True)
class TranscriptSegmentInput:
    index: int
    start_ms: int
    end_ms: int
    text: str
    speaker_label: str
    speaker_estimated: bool
    source_provider: str


class RecordingRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def create_recording_with_job(
        self,
        *,
        recording_id: str,
        filename: str,
        content_type: str,
        file_size: int,
        language: str,
        processing_mode: str,
        speaker_count: str,
        original_object_key: str,
        job_id: str,
    ) -> tuple[Recording, ProcessingJob]:
        recording = Recording(
            id=recording_id,
            filename=filename,
            content_type=content_type,
            file_size=file_size,
            language=language,
            processing_mode=processing_mode,
            speaker_count=speaker_count,
            original_object_key=original_object_key,
        )
        job = ProcessingJob(
            id=job_id,
            recording_id=recording_id,
            stage="uploaded",
            retryable=False,
            retry_count=0,
        )
        self.session.add(recording)
        self.session.add(job)
        self.session.commit()
        self.session.refresh(recording)
        self.session.refresh(job)
        return recording, job

    def get_recording(self, recording_id: str) -> Recording | None:
        return self.session.get(Recording, recording_id)

    def rename_recording(self, recording_id: str, filename: str) -> Recording:
        recording = self.require_recording(recording_id)
        recording.filename = filename
        recording.updated_at = datetime.now(UTC)
        self.session.commit()
        self.session.refresh(recording)
        return recording

    def get_job(self, recording_id: str) -> ProcessingJob | None:
        statement = select(ProcessingJob).where(ProcessingJob.recording_id == recording_id)
        return self.session.scalar(statement)

    def list_recordings(self) -> list[tuple[Recording, ProcessingJob, GeneratedNotes | None]]:
        statement = (
            select(Recording, ProcessingJob, GeneratedNotes)
            .join(ProcessingJob, ProcessingJob.recording_id == Recording.id)
            .outerjoin(GeneratedNotes, GeneratedNotes.recording_id == Recording.id)
            .order_by(Recording.updated_at.desc())
        )
        return list(self.session.execute(statement).all())

    def list_segments(self, recording_id: str) -> list[TranscriptSegment]:
        statement = (
            select(TranscriptSegment)
            .where(TranscriptSegment.recording_id == recording_id)
            .order_by(TranscriptSegment.index)
        )
        return list(self.session.scalars(statement))

    def rename_speaker(
        self,
        recording_id: str,
        *,
        from_label: str,
        to_label: str,
    ) -> list[TranscriptSegment]:
        recording = self.require_recording(recording_id)
        statement = select(TranscriptSegment).where(
            TranscriptSegment.recording_id == recording_id,
            TranscriptSegment.speaker_label == from_label,
        )
        matching_segments = list(self.session.scalars(statement))
        if not matching_segments:
            raise LookupError("Speaker label not found")

        now = datetime.now(UTC)
        for segment in matching_segments:
            segment.speaker_label = to_label
            segment.speaker_estimated = False
        recording.updated_at = now
        self.session.commit()
        return self.list_segments(recording_id)

    def update_segment(
        self,
        recording_id: str,
        *,
        segment_id: str,
        speaker_label: str,
        text: str,
    ) -> list[TranscriptSegment]:
        recording = self.require_recording(recording_id)
        statement = select(TranscriptSegment).where(
            TranscriptSegment.recording_id == recording_id,
            TranscriptSegment.id == segment_id,
        )
        segment = self.session.scalar(statement)
        if segment is None:
            raise LookupError("Transcript segment not found")

        segment.speaker_label = speaker_label
        segment.text = text
        segment.speaker_estimated = False
        recording.updated_at = datetime.now(UTC)
        self.session.commit()
        return self.list_segments(recording_id)

    def get_generated_notes(self, recording_id: str) -> GeneratedNotes | None:
        statement = select(GeneratedNotes).where(GeneratedNotes.recording_id == recording_id)
        return self.session.scalar(statement)

    def mark_job_failed(
        self,
        recording_id: str,
        *,
        error_message: str,
        retryable: bool,
    ) -> ProcessingJob:
        job = self.require_job(recording_id)
        recording = self.require_recording(recording_id)
        now = datetime.now(UTC)
        job.stage = "failed"
        job.error_message = error_message
        job.retryable = retryable
        job.completed_at = now
        recording.updated_at = now
        self.session.commit()
        self.session.refresh(job)
        return job

    def reset_failed_job(self, recording_id: str) -> ProcessingJob:
        job = self.require_job(recording_id)
        recording = self.require_recording(recording_id)
        recording.updated_at = datetime.now(UTC)
        job.stage = "uploaded"
        job.retry_count += 1
        job.error_message = None
        job.retryable = False
        job.started_at = None
        job.completed_at = None
        self.session.commit()
        self.session.refresh(job)
        return job

    def update_job_stage(
        self,
        recording_id: str,
        *,
        stage: str,
        retryable: bool | None = None,
        error_message: str | None = None,
        last_provider: str | None = None,
    ) -> ProcessingJob:
        job = self.require_job(recording_id)
        recording = self.require_recording(recording_id)
        now = datetime.now(UTC)
        if stage == "preprocessing" and job.started_at is None:
            job.started_at = now
        if stage == "completed":
            job.completed_at = now
        job.stage = stage
        job.error_message = error_message
        if retryable is not None:
            job.retryable = retryable
        if last_provider is not None:
            job.last_provider = last_provider
        recording.updated_at = now
        self.session.commit()
        self.session.refresh(job)
        return job

    def update_normalized_key(self, recording_id: str, normalized_object_key: str) -> Recording:
        recording = self.require_recording(recording_id)
        recording.normalized_object_key = normalized_object_key
        recording.updated_at = datetime.now(UTC)
        self.session.commit()
        self.session.refresh(recording)
        return recording

    def update_original_metadata(
        self,
        recording_id: str,
        *,
        filename: str,
        content_type: str,
        file_size: int,
        original_object_key: str,
    ) -> Recording:
        recording = self.require_recording(recording_id)
        recording.filename = filename
        recording.content_type = content_type
        recording.file_size = file_size
        recording.original_object_key = original_object_key
        recording.updated_at = datetime.now(UTC)
        self.session.commit()
        self.session.refresh(recording)
        return recording

    def queue_notes_generation(self, recording_id: str) -> GeneratedNotes:
        notes = self._ensure_generated_notes(recording_id)
        recording = self.require_recording(recording_id)
        recording.updated_at = datetime.now(UTC)
        notes.status = "queued"
        notes.error_message = None
        notes.started_at = None
        self.session.commit()
        self.session.refresh(notes)
        return notes

    def start_notes_generation(self, recording_id: str) -> GeneratedNotes:
        notes = self._ensure_generated_notes(recording_id)
        recording = self.require_recording(recording_id)
        now = datetime.now(UTC)
        notes.status = "generating"
        notes.error_message = None
        notes.started_at = now
        recording.updated_at = now
        self.session.commit()
        self.session.refresh(notes)
        return notes

    def complete_notes_generation(
        self,
        recording_id: str,
        *,
        content: str,
        source_provider: str,
    ) -> GeneratedNotes:
        notes = self._ensure_generated_notes(recording_id)
        recording = self.require_recording(recording_id)
        now = datetime.now(UTC)
        notes.status = "completed"
        notes.content = content
        notes.error_message = None
        notes.source_provider = source_provider
        notes.generation_count += 1
        if notes.started_at is None:
            notes.started_at = now
        notes.completed_at = now
        recording.updated_at = now
        self.session.commit()
        self.session.refresh(notes)
        return notes

    def fail_notes_generation(self, recording_id: str, *, error_message: str) -> GeneratedNotes:
        notes = self._ensure_generated_notes(recording_id)
        recording = self.require_recording(recording_id)
        notes.status = "failed"
        notes.error_message = error_message
        recording.updated_at = datetime.now(UTC)
        self.session.commit()
        self.session.refresh(notes)
        return notes

    def save_notes_edits(
        self,
        recording_id: str,
        *,
        content: str | None,
    ) -> GeneratedNotes:
        notes = self._ensure_generated_notes(recording_id)
        recording = self.require_recording(recording_id)
        now = datetime.now(UTC)
        notes.status = "completed"
        notes.content = content
        notes.error_message = None
        recording.updated_at = now
        self.session.commit()
        self.session.refresh(notes)
        return notes

    def replace_segments(
        self,
        recording_id: str,
        segments: list[TranscriptSegmentInput],
    ) -> list[TranscriptSegment]:
        recording = self.require_recording(recording_id)
        self.session.execute(
            delete(TranscriptSegment).where(TranscriptSegment.recording_id == recording_id)
        )
        persisted: list[TranscriptSegment] = []
        for segment in segments:
            model = TranscriptSegment(
                recording_id=recording_id,
                index=segment.index,
                start_ms=segment.start_ms,
                end_ms=segment.end_ms,
                text=segment.text,
                speaker_label=segment.speaker_label,
                speaker_estimated=segment.speaker_estimated,
                source_provider=segment.source_provider,
            )
            self.session.add(model)
            persisted.append(model)

        recording.updated_at = datetime.now(UTC)
        self.session.commit()
        for model in persisted:
            self.session.refresh(model)
        return persisted

    def require_recording(self, recording_id: str) -> Recording:
        recording = self.get_recording(recording_id)
        if recording is None:
            raise LookupError("Recording not found")
        return recording

    def require_job(self, recording_id: str) -> ProcessingJob:
        job = self.get_job(recording_id)
        if job is None:
            raise LookupError("Processing job not found")
        return job

    def require_generated_notes(self, recording_id: str) -> GeneratedNotes:
        notes = self.get_generated_notes(recording_id)
        if notes is None:
            raise LookupError("Generated notes not found")
        return notes

    def _ensure_generated_notes(self, recording_id: str) -> GeneratedNotes:
        notes = self.get_generated_notes(recording_id)
        if notes is not None:
            return notes

        notes = GeneratedNotes(
            recording_id=recording_id,
            status="idle",
            content=None,
            generation_count=0,
        )
        self.session.add(notes)
        self.session.flush()
        return notes
