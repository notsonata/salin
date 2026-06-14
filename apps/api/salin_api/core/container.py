from __future__ import annotations

from dataclasses import dataclass

from salin_api.services.notes import NotesProvider, OpenRouterNotesProvider
from salin_api.services.queue import JobQueue, RQJobQueue
from salin_api.storage.r2 import ObjectStorage, S3ObjectStorage


@dataclass(slots=True)
class ApiServices:
    storage: ObjectStorage
    job_queue: JobQueue
    notes_provider: NotesProvider


def build_services(*, redis_url: str, settings) -> ApiServices:
    return ApiServices(
        storage=S3ObjectStorage(
            bucket_name=settings.r2_bucket_name,
            endpoint_url=settings.r2_endpoint_url,
            access_key_id=settings.r2_access_key_id,
            secret_access_key=settings.r2_secret_access_key,
            region_name=settings.r2_region,
        ),
        job_queue=RQJobQueue(
            redis_url=redis_url,
            recording_job_timeout_seconds=settings.recording_job_timeout_seconds,
            notes_job_timeout_seconds=settings.notes_job_timeout_seconds,
        ),
        notes_provider=OpenRouterNotesProvider(
            api_key=settings.openrouter_api_key,
            models=settings.openrouter_models,
        ),
    )
