from __future__ import annotations

import json
import logging
import time
from pathlib import Path
from tempfile import TemporaryDirectory

from salin_api.core.settings import Settings
from salin_api.db.session import create_session_factory
from salin_api.repositories.recordings import RecordingRepository, TranscriptSegmentInput

from salin_worker.providers.base import TranscriptionProvider, TranscriptionResult
from salin_worker.providers.diarization import DiarizationProvider
from salin_worker.services.audio import AudioNormalizer
from salin_worker.services.diarization import align_speaker_labels

MAX_NORMALIZED_AUDIO_BYTES = 95 * 1024 * 1024
logger = logging.getLogger(__name__)


class RecordingProcessor:
    def __init__(
        self,
        *,
        settings: Settings,
        storage,
        groq_provider: TranscriptionProvider,
        local_provider: TranscriptionProvider,
        diarization_provider: DiarizationProvider | None = None,
        audio_normalizer: AudioNormalizer | None = None,
        session_factory=None,
        groq_retry_delays: tuple[float, ...] = (1.0, 2.0),
        sleep_fn=time.sleep,
    ) -> None:
        self.settings = settings
        self.storage = storage
        self.groq_provider = groq_provider
        self.local_provider = local_provider
        self.diarization_provider = diarization_provider
        self.audio_normalizer = audio_normalizer or AudioNormalizer()
        self.session_factory = session_factory or create_session_factory(settings.database_url)
        self.groq_retry_delays = groq_retry_delays
        self.sleep_fn = sleep_fn

    def process(self, recording_id: str) -> None:
        with TemporaryDirectory(prefix="salin-recording-") as tmpdir:
            tmpdir_path = Path(tmpdir)
            session = self.session_factory()
            try:
                repository = RecordingRepository(session)
                recording = repository.require_recording(recording_id)
                repository.update_job_stage(recording_id, stage="preprocessing", retryable=False)

                original_path = tmpdir_path / recording.filename
                normalized_path = tmpdir_path / "audio.wav"
                self.storage.download_file(recording.original_object_key, original_path)
                self.audio_normalizer.normalize(
                    source_path=original_path,
                    destination_path=normalized_path,
                )

                if normalized_path.stat().st_size > MAX_NORMALIZED_AUDIO_BYTES:
                    raise ValueError(
                        "Long recordings land in the next milestone. "
                        "Please keep uploads within the single-file transcript path for now."
                    )

                normalized_key = f"recordings/{recording_id}/normalized/audio.wav"
                self.storage.upload_file(normalized_key, normalized_path, "audio/wav")
                repository.update_normalized_key(recording_id, normalized_key)
                repository.update_job_stage(recording_id, stage="transcribing", retryable=False)

                result, fallback_message = self._transcribe_with_fallback(
                    recording_id=recording_id,
                    repository=repository,
                    audio_path=normalized_path,
                    language=recording.language,
                    processing_mode=recording.processing_mode,
                )
                processing_notes = [fallback_message] if fallback_message else []

                artifact_key = (
                    f"recordings/{recording_id}/artifacts/{result.source_provider}-raw.json"
                )
                self.storage.upload_bytes(
                    artifact_key,
                    json.dumps(result.raw_payload).encode("utf-8"),
                    "application/json",
                )

                transcript_segments = [
                    TranscriptSegmentInput(
                        index=index,
                        start_ms=segment.start_ms,
                        end_ms=segment.end_ms,
                        text=segment.text,
                        speaker_label="Speaker",
                        speaker_estimated=True,
                        source_provider=result.source_provider,
                    )
                    for index, segment in enumerate(result.segments)
                ]
                repository.replace_segments(recording_id, transcript_segments)

                aligned_segments, diarization_message = self._align_with_diarization(
                    recording_id=recording_id,
                    audio_path=normalized_path,
                    speaker_count=recording.speaker_count,
                    transcript_segments=transcript_segments,
                    repository=repository,
                    status_message=" ".join(processing_notes) or None,
                )
                if diarization_message:
                    processing_notes.append(diarization_message)

                if aligned_segments is not transcript_segments:
                    repository.replace_segments(recording_id, aligned_segments)
                repository.update_job_stage(
                    recording_id,
                    stage="completed",
                    retryable=False,
                    error_message=" ".join(processing_notes) or None,
                    last_provider=result.source_provider,
                )
            except Exception as exc:
                repository = RecordingRepository(session)
                repository.mark_job_failed(
                    recording_id,
                    error_message=str(exc),
                    retryable=True,
                )
                raise
            finally:
                session.close()

    def _transcribe_with_fallback(
        self,
        *,
        recording_id: str,
        repository: RecordingRepository,
        audio_path: Path,
        language: str,
        processing_mode: str,
    ) -> tuple[TranscriptionResult, str | None]:
        groq_model = (
            self.settings.groq_fast_model
            if processing_mode == "fast"
            else self.settings.groq_transcription_model
        )
        repository.update_job_stage(
            recording_id,
            stage="transcribing",
            retryable=False,
            error_message=None,
            last_provider="groq",
        )
        last_groq_error: Exception | None = None
        for attempt_index in range(len(self.groq_retry_delays) + 1):
            try:
                return (
                    self.groq_provider.transcribe(
                        audio_path=audio_path,
                        language=language,
                        model_name=groq_model,
                    ),
                    None,
                )
            except Exception as exc:
                last_groq_error = exc
                logger.warning(
                    "Groq transcription attempt %s failed for recording %s: %s",
                    attempt_index + 1,
                    recording_id,
                    exc,
                )
                if attempt_index >= len(self.groq_retry_delays):
                    break
                self.sleep_fn(self.groq_retry_delays[attempt_index])

        fallback_message = (
            "Groq transcription failed; using local backup. "
            f"{self._summarize_exception(last_groq_error)}"
        )
        repository.update_job_stage(
            recording_id,
            stage="transcribing",
            retryable=False,
            error_message=fallback_message,
            last_provider="faster-whisper",
        )
        return (
            self.local_provider.transcribe(
                audio_path=audio_path,
                language=language,
                model_name=self.settings.local_transcription_model,
            ),
            fallback_message,
        )

    def _align_with_diarization(
        self,
        *,
        recording_id: str,
        audio_path: Path,
        speaker_count: str,
        transcript_segments: list[TranscriptSegmentInput],
        repository: RecordingRepository,
        status_message: str | None,
    ) -> tuple[list[TranscriptSegmentInput], str | None]:
        if self.diarization_provider is None:
            return transcript_segments, None

        repository.update_job_stage(
            recording_id,
            stage="diarizing",
            retryable=False,
            error_message=status_message,
        )

        try:
            result = self.diarization_provider.diarize(
                audio_path=audio_path,
                speaker_count=speaker_count,
            )
        except Exception as exc:
            logger.warning("Diarization failed for recording %s: %s", recording_id, exc)
            diarization_message = (
                "Diarization failed; transcript remains available. "
                f"{self._summarize_exception(exc)}"
            )
            self._upload_optional_json_artifact(
                recording_id=recording_id,
                artifact_name="diarization-error",
                payload={"error": str(exc)},
            )
            return transcript_segments, diarization_message

        self._upload_optional_json_artifact(
            recording_id=recording_id,
            artifact_name=f"{result.source_provider}-diarization-raw",
            payload=result.raw_payload,
        )
        return align_speaker_labels(transcript_segments, result.segments), None

    @staticmethod
    def _summarize_exception(exc: Exception | None) -> str:
        if exc is None:
            return "The provider did not return an error message."

        message = str(exc).strip()
        if len(message) > 300:
            message = f"{message[:297]}..."
        return f"{type(exc).__name__}: {message}" if message else type(exc).__name__

    def _upload_optional_json_artifact(
        self,
        *,
        recording_id: str,
        artifact_name: str,
        payload: dict,
    ) -> None:
        try:
            self.storage.upload_bytes(
                f"recordings/{recording_id}/artifacts/{artifact_name}.json",
                json.dumps(payload).encode("utf-8"),
                "application/json",
            )
        except Exception as exc:
            logger.warning(
                "Could not upload optional artifact %s for recording %s: %s",
                artifact_name,
                recording_id,
                exc,
            )
