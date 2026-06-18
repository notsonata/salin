from __future__ import annotations

from sqlalchemy.orm import Session

from salin_api.models import AppSetting

DIARIZATION_ENABLED_KEY = "diarization_enabled"


class AppSettingsRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_diarization_enabled(self) -> bool | None:
        setting = self.session.get(AppSetting, DIARIZATION_ENABLED_KEY)
        if setting is None:
            return None
        return setting.value == "true"

    def set_diarization_enabled(self, enabled: bool) -> bool:
        setting = self.session.get(AppSetting, DIARIZATION_ENABLED_KEY)
        value = "true" if enabled else "false"
        if setting is None:
            setting = AppSetting(key=DIARIZATION_ENABLED_KEY, value=value)
            self.session.add(setting)
        else:
            setting.value = value
        self.session.commit()
        return enabled
