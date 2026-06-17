from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass
from pathlib import Path
from tempfile import TemporaryDirectory

from salin_api.core.settings import Settings
from salin_api.db.session import create_session_factory
from salin_api.recording_sources import YOUTUBE_IMPORT_CONTENT_TYPE, YOUTUBE_IMPORT_KIND
from salin_api.repositories.recordings import RecordingRepository, TranscriptSegmentInput

from salin_worker.providers.base import ProviderSegment, TranscriptionProvider, TranscriptionResult
from salin_worker.providers.diarization import DiarizationProvider
from salin_worker.services.audio import AudioChunk, AudioChunker, AudioNormalizer
from salin_worker.services.diarization import align_speaker_labels
from salin_worker.services.youtube import YouTubeAudioImporter

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class PreparedOriginal:
    path: Path
    recording: object
    processing_note: str | None = None


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
        audio_chunker: AudioChunker | None = None,
        youtube_importer: YouTubeAudioImporter | None = None,
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
        self.audio_chunker = audio_chunker or AudioChunker()
        self.youtube_importer = youtube_importer or YouTubeAudioImporter(
            max_duration_seconds=settings.youtube_import_max_minutes * 60,
            cookies_file=settings.youtube_cookies_file or None,
        )
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

                normalized_path = tmpdir_path / "audio.wav"
                prepared_original = self._prepare_original(
                    recording_id=recording_id,
                    recording=recording,
                    repository=repository,
                    work_dir=tmpdir_path,
                )
                recording = prepared_original.recording
                original_path = prepared_original.path
                self.audio_normalizer.normalize(
                    source_path=original_path,
                    destination_path=normalized_path,
                )

                normalized_key = f"recordings/{recording_id}/normalized/audio.wav"
                self.storage.upload_file(normalized_key, normalized_path, "audio/wav")
                repository.update_normalized_key(recording_id, normalized_key)
                repository.update_job_stage(recording_id, stage="transcribing", retryable=False)

                result, processing_notes = self._transcribe_audio(
                    recording_id=recording_id,
                    repository=repository,
                    audio_path=normalized_path,
                    language=recording.language,
                    processing_mode=recording.processing_mode,
                    work_dir=tmpdir_path,
                )
                if prepared_original.processing_note:
                    processing_notes.insert(0, prepared_original.processing_note)

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

    def _prepare_original(
        self,
        *,
        recording_id: str,
        recording,
        repository: RecordingRepository,
        work_dir: Path,
    ) -> PreparedOriginal:
        if recording.content_type != YOUTUBE_IMPORT_CONTENT_TYPE:
            original_path = work_dir / recording.filename
            self.storage.download_file(recording.original_object_key, original_path)
            return PreparedOriginal(path=original_path, recording=recording)

        repository.update_job_stage(
            recording_id,
            stage="preprocessing",
            retryable=False,
            error_message="Importing audio from YouTube.",
        )
        descriptor = self._load_youtube_import_descriptor(recording.original_object_key)
        import_dir = work_dir / "youtube-import"
        imported_audio = self.youtube_importer.download_audio(
            url=descriptor["url"],
            output_dir=import_dir,
        )
        original_key = f"recordings/{recording_id}/original/{imported_audio.filename}"
        self.storage.upload_file(
            original_key,
            imported_audio.path,
            imported_audio.content_type,
        )
        self._upload_optional_json_artifact(
            recording_id=recording_id,
            artifact_name="youtube-import",
            payload={
                "url": imported_audio.webpage_url,
                "title": imported_audio.title,
                "duration_seconds": imported_audio.duration_seconds,
                "filename": imported_audio.filename,
            },
        )
        updated_recording = repository.update_original_metadata(
            recording_id,
            filename=imported_audio.filename,
            content_type=imported_audio.content_type,
            file_size=imported_audio.file_size,
            original_object_key=original_key,
        )
        return PreparedOriginal(
            path=imported_audio.path,
            recording=updated_recording,
            processing_note="Imported YouTube audio before transcription.",
        )

    def _load_youtube_import_descriptor(self, object_key: str) -> dict[str, str]:
        try:
            payload = json.loads(self.storage.download_bytes(object_key).decode("utf-8"))
        except Exception as exc:
            raise ValueError("YouTube import descriptor could not be read.") from exc

        if payload.get("kind") != YOUTUBE_IMPORT_KIND or not isinstance(payload.get("url"), str):
            raise ValueError("YouTube import descriptor is invalid.")
        return {"url": payload["url"]}

    def _transcribe_audio(
        self,
        *,
        recording_id: str,
        repository: RecordingRepository,
        audio_path: Path,
        language: str,
        processing_mode: str,
        work_dir: Path,
    ) -> tuple[TranscriptionResult, list[str]]:
        chunk_length_ms = self.settings.transcription_chunk_minutes * 60_000
        overlap_ms = self.settings.transcription_chunk_overlap_seconds * 1000
        chunks = self.audio_chunker.split(
            source_path=audio_path,
            output_dir=work_dir,
            chunk_length_ms=chunk_length_ms,
            overlap_ms=overlap_ms,
        )

        if len(chunks) == 1:
            result, fallback_message = self._transcribe_with_fallback(
                recording_id=recording_id,
                repository=repository,
                audio_path=chunks[0].path,
                language=language,
                processing_mode=processing_mode,
            )
            return result, [fallback_message] if fallback_message else []

        return self._transcribe_chunks(
            recording_id=recording_id,
            repository=repository,
            chunks=chunks,
            language=language,
            processing_mode=processing_mode,
            overlap_ms=overlap_ms,
        )

    def _transcribe_chunks(
        self,
        *,
        recording_id: str,
        repository: RecordingRepository,
        chunks: list[AudioChunk],
        language: str,
        processing_mode: str,
        overlap_ms: int,
    ) -> tuple[TranscriptionResult, list[str]]:
        chunk_results: list[tuple[AudioChunk, TranscriptionResult, str]] = []
        fallback_messages: list[str] = []
        total_chunks = len(chunks)

        for chunk_index, chunk in enumerate(chunks):
            progress_message = f"Transcribing chunk {chunk_index + 1}/{total_chunks}"
            chunk_artifact_key = self._chunk_result_artifact_key(recording_id, chunk)
            cached_result = self._load_cached_chunk_result(chunk_artifact_key)
            if cached_result is not None:
                repository.update_job_stage(
                    recording_id,
                    stage="transcribing",
                    retryable=False,
                    error_message=f"Using cached transcript chunk {chunk_index + 1}/{total_chunks}",
                    last_provider=cached_result.source_provider,
                )
                chunk_results.append((chunk, cached_result, chunk_artifact_key))
                continue

            result, fallback_message = self._transcribe_with_fallback(
                recording_id=recording_id,
                repository=repository,
                audio_path=chunk.path,
                language=language,
                processing_mode=processing_mode,
                progress_message=progress_message,
            )
            self._upload_chunk_result(chunk_artifact_key, result)
            chunk_results.append((chunk, result, chunk_artifact_key))
            if fallback_message:
                fallback_messages.append(fallback_message)

        merged_segments = self._merge_chunk_segments(
            chunk_results=[
                (chunk, result) for chunk, result, _artifact_key in chunk_results
            ],
            overlap_ms=overlap_ms,
            total_duration_ms=chunks[-1].end_ms,
        )
        source_provider = self._combined_source_provider(
            [result.source_provider for _chunk, result, _artifact_key in chunk_results]
        )
        raw_payload = {
            "chunked": True,
            "chunk_count": total_chunks,
            "chunk_overlap_ms": overlap_ms,
            "source_providers": sorted(
                {result.source_provider for _chunk, result, _artifact_key in chunk_results}
            ),
            "chunks": [
                {
                    "index": chunk.index,
                    "start_ms": chunk.start_ms,
                    "end_ms": chunk.end_ms,
                    "source_provider": result.source_provider,
                    "artifact_key": artifact_key,
                }
                for chunk, result, artifact_key in chunk_results
            ],
        }
        return (
            TranscriptionResult(
                source_provider=source_provider,
                raw_payload=raw_payload,
                segments=merged_segments,
            ),
            self._summarize_transcription_notes(fallback_messages),
        )

    def _transcribe_with_fallback(
        self,
        *,
        recording_id: str,
        repository: RecordingRepository,
        audio_path: Path,
        language: str,
        processing_mode: str,
        progress_message: str | None = None,
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
            error_message=progress_message,
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

        fallback_message = "Groq transcription failed; using local backup. "
        if progress_message:
            fallback_message = f"{progress_message}. {fallback_message}"
        fallback_message = f"{fallback_message}{self._summarize_exception(last_groq_error)}"
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

    def _chunk_result_artifact_key(self, recording_id: str, chunk: AudioChunk) -> str:
        return (
            f"recordings/{recording_id}/artifacts/transcription-chunks/"
            f"chunk-{chunk.index:04d}-result.json"
        )

    def _load_cached_chunk_result(self, artifact_key: str) -> TranscriptionResult | None:
        try:
            payload = json.loads(self.storage.download_bytes(artifact_key).decode("utf-8"))
        except Exception as exc:
            logger.debug("No reusable transcription chunk artifact at %s: %s", artifact_key, exc)
            return None

        segments = [
            ProviderSegment(
                start_ms=int(segment["start_ms"]),
                end_ms=int(segment["end_ms"]),
                text=str(segment["text"]).strip(),
            )
            for segment in payload.get("segments", [])
        ]
        return TranscriptionResult(
            source_provider=str(payload["source_provider"]),
            raw_payload=payload.get("raw_payload", {}),
            segments=segments,
        )

    def _upload_chunk_result(self, artifact_key: str, result: TranscriptionResult) -> None:
        payload = {
            "source_provider": result.source_provider,
            "raw_payload": result.raw_payload,
            "segments": [
                {
                    "start_ms": segment.start_ms,
                    "end_ms": segment.end_ms,
                    "text": segment.text,
                }
                for segment in result.segments
            ],
        }
        self.storage.upload_bytes(
            artifact_key,
            json.dumps(payload).encode("utf-8"),
            "application/json",
        )

    def _merge_chunk_segments(
        self,
        *,
        chunk_results: list[tuple[AudioChunk, TranscriptionResult]],
        overlap_ms: int,
        total_duration_ms: int,
    ) -> list[ProviderSegment]:
        merged: list[ProviderSegment] = []
        for chunk_position, (chunk, result) in enumerate(chunk_results):
            accept_start_ms = chunk.start_ms
            if chunk_position > 0:
                accept_start_ms = min(chunk.end_ms, chunk.start_ms + overlap_ms)

            for segment in result.segments:
                text = segment.text.strip()
                if not text:
                    continue

                absolute_start_ms = chunk.start_ms + max(0, segment.start_ms)
                absolute_end_ms = chunk.start_ms + max(segment.end_ms, segment.start_ms)
                absolute_end_ms = min(absolute_end_ms, chunk.end_ms, total_duration_ms)
                if absolute_end_ms <= accept_start_ms:
                    continue
                absolute_start_ms = max(absolute_start_ms, accept_start_ms)
                if absolute_end_ms <= absolute_start_ms:
                    continue

                merged.append(
                    ProviderSegment(
                        start_ms=absolute_start_ms,
                        end_ms=absolute_end_ms,
                        text=text,
                    )
                )

        return sorted(merged, key=lambda segment: (segment.start_ms, segment.end_ms))

    @staticmethod
    def _combined_source_provider(source_providers: list[str]) -> str:
        unique_providers = sorted(set(source_providers))
        if len(unique_providers) == 1:
            return unique_providers[0]
        return "mixed"

    @staticmethod
    def _summarize_transcription_notes(messages: list[str]) -> list[str]:
        if len(messages) <= 1:
            return messages

        return [
            f"{len(messages)} transcription chunks used local backup after Groq failure. "
            f"First fallback: {messages[0]}"
        ]

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
