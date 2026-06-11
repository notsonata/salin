from __future__ import annotations

import json
import time
from pathlib import Path
from tempfile import TemporaryDirectory

from salin_api.core.settings import Settings
from salin_api.db.session import create_session_factory
from salin_api.repositories.recordings import RecordingRepository, TranscriptSegmentInput
from salin_worker.providers.base import TranscriptionProvider, TranscriptionResult
from salin_worker.services.audio import AudioNormalizer

MAX_NORMALIZED_AUDIO_BYTES = 95 * 1024 * 1024


class RecordingProcessor:
    def __init__(
        self,
        *,
        settings: Settings,
        storage,
        groq_provider: TranscriptionProvider,
        local_provider: TranscriptionProvider,
        audio_normalizer: AudioNormalizer | None = None,
        session_factory=None,
        groq_retry_delays: tuple[float, ...] = (1.0, 2.0),
        sleep_fn=time.sleep,
    ) -> None:
        self.settings = settings
        self.storage = storage
        self.groq_provider = groq_provider
        self.local_provider = local_provider
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

                result = self._transcribe_with_fallback(
                    audio_path=normalized_path,
                    language=recording.language,
                    processing_mode=recording.processing_mode,
                )

                artifact_key = (
                    f"recordings/{recording_id}/artifacts/{result.source_provider}-raw.json"
                )
                self.storage.upload_bytes(
                    artifact_key,
                    json.dumps(result.raw_payload).encode("utf-8"),
                    "application/json",
                )

                repository.replace_segments(
                    recording_id,
                    [
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
                    ],
                )
                repository.update_job_stage(
                    recording_id,
                    stage="completed",
                    retryable=False,
                    error_message=None,
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
        audio_path: Path,
        language: str,
        processing_mode: str,
    ) -> TranscriptionResult:
        groq_model = (
            self.settings.groq_fast_model
            if processing_mode == "fast"
            else self.settings.groq_transcription_model
        )
        for attempt_index in range(len(self.groq_retry_delays) + 1):
            try:
                return self.groq_provider.transcribe(
                    audio_path=audio_path,
                    language=language,
                    model_name=groq_model,
                )
            except Exception:
                if attempt_index >= len(self.groq_retry_delays):
                    break
                self.sleep_fn(self.groq_retry_delays[attempt_index])

        return self.local_provider.transcribe(
            audio_path=audio_path,
            language=language,
            model_name=self.settings.local_transcription_model,
        )
