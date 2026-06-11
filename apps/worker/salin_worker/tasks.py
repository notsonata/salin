from __future__ import annotations

from salin_api.core.settings import get_settings
from salin_api.storage.r2 import S3ObjectStorage
from salin_worker.providers.faster_whisper_provider import FasterWhisperTranscriptionProvider
from salin_worker.providers.groq_provider import GroqTranscriptionProvider
from salin_worker.services.processing import RecordingProcessor


def process_recording(recording_id: str) -> None:
    settings = get_settings()
    storage = S3ObjectStorage(
        bucket_name=settings.r2_bucket_name,
        endpoint_url=settings.r2_endpoint_url,
        access_key_id=settings.r2_access_key_id,
        secret_access_key=settings.r2_secret_access_key,
        region_name=settings.r2_region,
    )
    processor = RecordingProcessor(
        settings=settings,
        storage=storage,
        groq_provider=GroqTranscriptionProvider(api_key=settings.groq_api_key),
        local_provider=FasterWhisperTranscriptionProvider(
            model_name=settings.local_transcription_model,
        ),
    )
    processor.process(recording_id)
