from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from salin_api.db.base import Base


class GeneratedNotes(Base):
    __tablename__ = "generated_notes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    recording_id: Mapped[str] = mapped_column(ForeignKey("recordings.id"), unique=True)
    status: Mapped[str] = mapped_column(String(32), default="idle")
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    key_points_json: Mapped[str] = mapped_column(Text, default="[]")
    decisions_json: Mapped[str] = mapped_column(Text, default="[]")
    action_items_json: Mapped[str] = mapped_column(Text, default="[]")
    questions_json: Mapped[str] = mapped_column(Text, default="[]")
    error_message: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    source_provider: Mapped[str | None] = mapped_column(String(128), nullable=True)
    generation_count: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=True,
    )

    recording = relationship("Recording", back_populates="generated_notes")
