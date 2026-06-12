from __future__ import annotations

from salin_api.core.settings import Settings
from salin_api.db.session import create_session_factory
from salin_api.repositories.recordings import RecordingRepository
from salin_api.services.notes import (
    NotesGenerationRequest,
    NotesProvider,
    NotesTranscriptSegment,
)


class RecordingNotesGenerator:
    def __init__(
        self,
        *,
        settings: Settings,
        notes_provider: NotesProvider,
        session_factory=None,
    ) -> None:
        self.settings = settings
        self.notes_provider = notes_provider
        self.session_factory = session_factory or create_session_factory(settings.database_url)

    def generate(self, recording_id: str) -> None:
        session = self.session_factory()
        try:
            repository = RecordingRepository(session)
            recording = repository.require_recording(recording_id)
            job = repository.require_job(recording_id)
            if job.stage != "completed":
                raise ValueError("Transcription must be completed before generating notes.")

            transcript_segments = repository.list_segments(recording_id)
            if not transcript_segments:
                raise ValueError("Transcript segments are required before generating notes.")

            repository.start_notes_generation(recording_id)
            result = self.notes_provider.generate_notes(
                request=NotesGenerationRequest(
                    recording_id=recording.id,
                    filename=recording.filename,
                    language=recording.language,
                    transcript_segments=[
                        NotesTranscriptSegment(
                            start_ms=segment.start_ms,
                            end_ms=segment.end_ms,
                            speaker_label=segment.speaker_label,
                            text=segment.text,
                        )
                        for segment in transcript_segments
                    ],
                )
            )
            repository.complete_notes_generation(
                recording_id,
                summary=result.summary,
                key_points=result.key_points,
                decisions=result.decisions,
                action_items=result.action_items,
                questions=result.questions,
                source_provider=result.source_provider,
            )
        except Exception as exc:
            repository = RecordingRepository(session)
            repository.fail_notes_generation(recording_id, error_message=str(exc))
            raise
        finally:
            session.close()
