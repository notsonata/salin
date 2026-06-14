from __future__ import annotations

import logging

from salin_api.core.settings import Settings, get_settings
from salin_api.services.notes import OpenRouterNotesProvider
from salin_api.storage.r2 import S3ObjectStorage

from salin_worker.providers.diarization import DiarizationProvider
from salin_worker.providers.faster_whisper_provider import FasterWhisperTranscriptionProvider
from salin_worker.providers.groq_provider import GroqTranscriptionProvider
from salin_worker.providers.pyannote_provider import PyannoteDiarizationProvider
from salin_worker.services.notes import RecordingNotesGenerator
from salin_worker.services.processing import RecordingProcessor

logger = logging.getLogger(__name__)


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
        diarization_provider=build_diarization_provider(settings),
    )
    processor.process(recording_id)


def generate_notes(recording_id: str) -> None:
    settings = get_settings()
    generator = RecordingNotesGenerator(
        settings=settings,
        notes_provider=OpenRouterNotesProvider(
            api_key=settings.openrouter_api_key,
            models=settings.openrouter_models,
        ),
    )
    generator.generate(recording_id)


def build_diarization_provider(settings: Settings) -> DiarizationProvider | None:
    provider_name = settings.diarization_provider.strip().lower()
    if provider_name in {"", "none", "off", "disabled"}:
        return None

    if provider_name != "pyannote":
        logger.warning("Unsupported diarization provider %s; diarization disabled.", provider_name)
        return None

    if not settings.pyannote_auth_token:
        logger.warning("DIARIZATION_PROVIDER=pyannote requires PYANNOTE_AUTH_TOKEN.")
        return None

    try:
        return PyannoteDiarizationProvider(
            auth_token=settings.pyannote_auth_token,
            model_name=settings.pyannote_model,
            device=settings.pyannote_device,
        )
    except Exception as exc:
        logger.warning("Could not initialize pyannote diarization: %s", exc)
        return None
