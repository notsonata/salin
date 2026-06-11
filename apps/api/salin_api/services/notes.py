from __future__ import annotations

from typing import Protocol


class NotesProvider(Protocol):
    def generate_notes(self, recording_id: str) -> dict: ...


class OpenRouterNotesProvider:
    def __init__(self, *, api_key: str, models: str) -> None:
        self.api_key = api_key
        self.models = [model.strip() for model in models.split(",") if model.strip()]

    def generate_notes(self, recording_id: str) -> dict:
        raise NotImplementedError(
            "Notes generation is intentionally deferred. "
            "This boundary exists for the next milestone."
        )
