from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = Field(default="development", alias="APP_ENV")
    database_url: str = Field(
        default="sqlite:///./salin.db",
        alias="DATABASE_URL",
    )
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    cors_allowed_origins: str = Field(
        default="http://localhost:3000",
        alias="CORS_ALLOWED_ORIGINS",
    )
    r2_bucket_name: str = Field(default="salin-dev", alias="R2_BUCKET_NAME")
    r2_endpoint_url: str = Field(default="", alias="R2_ENDPOINT_URL")
    r2_access_key_id: str = Field(default="", alias="R2_ACCESS_KEY_ID")
    r2_secret_access_key: str = Field(default="", alias="R2_SECRET_ACCESS_KEY")
    r2_region: str = Field(default="auto", alias="R2_REGION")
    groq_api_key: str = Field(default="", alias="GROQ_API_KEY")
    groq_transcription_model: str = Field(
        default="whisper-large-v3",
        alias="GROQ_TRANSCRIPTION_MODEL",
    )
    groq_fast_model: str = Field(
        default="whisper-large-v3-turbo",
        alias="GROQ_FAST_MODEL",
    )
    openrouter_api_key: str = Field(default="", alias="OPENROUTER_API_KEY")
    openrouter_models: str = Field(default="", alias="OPENROUTER_MODELS")
    local_transcription_model: str = Field(
        default="small",
        alias="LOCAL_TRANSCRIPTION_MODEL",
    )
    transcription_chunk_minutes: int = Field(
        default=10,
        ge=1,
        alias="TRANSCRIPTION_CHUNK_MINUTES",
    )
    transcription_chunk_overlap_seconds: int = Field(
        default=15,
        ge=0,
        alias="TRANSCRIPTION_CHUNK_OVERLAP_SECONDS",
    )
    recording_job_timeout_seconds: int = Field(
        default=3600,
        ge=1,
        alias="RECORDING_JOB_TIMEOUT_SECONDS",
    )
    notes_job_timeout_seconds: int = Field(
        default=600,
        ge=1,
        alias="NOTES_JOB_TIMEOUT_SECONDS",
    )
    youtube_import_max_minutes: int = Field(
        default=180,
        ge=1,
        alias="YOUTUBE_IMPORT_MAX_MINUTES",
    )
    youtube_cookies_file: str = Field(default="", alias="YOUTUBE_COOKIES_FILE")
    youtube_user_agent: str = Field(default="", alias="YOUTUBE_USER_AGENT")
    youtube_pot_provider_url: str = Field(default="", alias="YOUTUBE_POT_PROVIDER_URL")
    diarization_provider: str = Field(default="none", alias="DIARIZATION_PROVIDER")
    pyannote_auth_token: str = Field(default="", alias="PYANNOTE_AUTH_TOKEN")
    pyannote_model: str = Field(
        default="pyannote/speaker-diarization-community-1",
        alias="PYANNOTE_MODEL",
    )
    pyannote_device: str = Field(default="auto", alias="PYANNOTE_DEVICE")
    max_upload_mb: int = Field(default=100, alias="MAX_UPLOAD_MB")
    next_public_api_base_url: str = Field(
        default="http://localhost:8000",
        alias="NEXT_PUBLIC_API_BASE_URL",
    )
    salin_api_internal_base_url: str = Field(
        default="http://api:8000",
        alias="SALIN_API_INTERNAL_BASE_URL",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        populate_by_name=True,
        extra="ignore",
    )

    def parsed_cors_allowed_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_allowed_origins.split(",")
            if origin.strip()
        ]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
