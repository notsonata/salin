from __future__ import annotations

from pydantic import BaseModel


class AppSettingsResponse(BaseModel):
    diarization_enabled: bool
