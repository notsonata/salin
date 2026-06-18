from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from sqlalchemy.orm import Session

from salin_api.core.settings import Settings
from salin_api.repositories.app_settings import AppSettingsRepository


class SessionFactory(Protocol):
    def __call__(self) -> Session: ...


@dataclass(frozen=True, slots=True)
class AppSettingsState:
    diarization_available: bool
    diarization_enabled: bool


def diarization_default_enabled(settings: Settings) -> bool:
    return (
        settings.diarization_provider.strip().lower() == "pyannote"
        and diarization_available(settings)
    )


def diarization_available(settings: Settings) -> bool:
    token = settings.pyannote_auth_token.strip()
    return bool(token) and token != "changeme"


def get_app_settings_state(
    *,
    settings: Settings,
    repository: AppSettingsRepository,
) -> AppSettingsState:
    available = diarization_available(settings)
    stored_enabled = repository.get_diarization_enabled()
    enabled = (
        stored_enabled
        if stored_enabled is not None
        else diarization_default_enabled(settings)
    )
    return AppSettingsState(
        diarization_available=available,
        diarization_enabled=available and enabled,
    )


def get_diarization_enabled_for_worker(
    *,
    settings: Settings,
    session_factory: SessionFactory,
) -> bool:
    session = session_factory()
    try:
        repository = AppSettingsRepository(session)
        state = get_app_settings_state(settings=settings, repository=repository)
        return state.diarization_enabled
    finally:
        session.close()
