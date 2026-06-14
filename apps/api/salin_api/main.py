from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from salin_api.api.routes import router
from salin_api.core.container import ApiServices, build_services
from salin_api.core.settings import Settings, get_settings
from salin_api.db.base import Base
from salin_api.db.session import create_engine_for_url, create_session_factory
from salin_api.models import (  # noqa: F401
    GeneratedNotes,
    ProcessingJob,
    Recording,
    TranscriptSegment,
)


def create_app(
    *,
    settings: Settings | None = None,
    services: ApiServices | None = None,
) -> FastAPI:
    app = FastAPI(
        title="Salin API",
        version="0.1.0",
        description="Upload and transcript orchestration for Salin.",
    )
    resolved_settings = settings or get_settings()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=resolved_settings.parsed_cors_allowed_origins(),
        allow_methods=["*"],
        allow_headers=["*"],
    )
    session_factory = create_session_factory(resolved_settings.database_url)
    engine = create_engine_for_url(resolved_settings.database_url)
    resolved_services = services or build_services(
        redis_url=resolved_settings.redis_url,
        settings=resolved_settings,
    )

    app.state.settings = resolved_settings
    app.state.session_factory = session_factory
    app.state.services = resolved_services

    @app.on_event("startup")
    def ensure_database() -> None:
        Base.metadata.create_all(engine)

    app.include_router(router)
    return app


app = create_app()
