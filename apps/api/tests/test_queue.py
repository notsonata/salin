from __future__ import annotations

from salin_api.services.queue import RQJobQueue


class FakeQueue:
    def __init__(self) -> None:
        self.calls: list[tuple[str, tuple[str, ...], dict[str, int]]] = []

    def enqueue(self, task_name: str, *args: str, **kwargs: int) -> None:
        self.calls.append((task_name, args, kwargs))


def test_rq_queue_sets_explicit_job_timeouts() -> None:
    queue = object.__new__(RQJobQueue)
    fake_queue = FakeQueue()
    queue.queue = fake_queue
    queue.recording_job_timeout_seconds = 3600
    queue.notes_job_timeout_seconds = 600

    queue.enqueue_recording("recording-1")
    queue.enqueue_notes("recording-1")

    assert fake_queue.calls == [
        (
            "salin_worker.tasks.process_recording",
            ("recording-1",),
            {"job_timeout": 3600},
        ),
        (
            "salin_worker.tasks.generate_notes",
            ("recording-1",),
            {"job_timeout": 600},
        ),
    ]
