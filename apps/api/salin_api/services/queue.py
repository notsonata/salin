from __future__ import annotations

from typing import Protocol

from redis import Redis
from rq import Queue


class JobQueue(Protocol):
    def enqueue_recording(self, recording_id: str) -> None: ...
    def enqueue_notes(self, recording_id: str) -> None: ...


class RQJobQueue:
    def __init__(
        self,
        *,
        redis_url: str,
        recording_job_timeout_seconds: int = 3600,
        notes_job_timeout_seconds: int = 600,
    ) -> None:
        self.redis = Redis.from_url(redis_url)
        self.queue = Queue(name="salin-recordings", connection=self.redis)
        self.recording_job_timeout_seconds = recording_job_timeout_seconds
        self.notes_job_timeout_seconds = notes_job_timeout_seconds

    def enqueue_recording(self, recording_id: str) -> None:
        self.queue.enqueue(
            "salin_worker.tasks.process_recording",
            recording_id,
            job_timeout=self.recording_job_timeout_seconds,
        )

    def enqueue_notes(self, recording_id: str) -> None:
        self.queue.enqueue(
            "salin_worker.tasks.generate_notes",
            recording_id,
            job_timeout=self.notes_job_timeout_seconds,
        )
