from __future__ import annotations

from uuid import uuid4

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from salin_api.db.base import Base


class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    recording_id: Mapped[str] = mapped_column(ForeignKey("recordings.id"), index=True)
    index: Mapped[int] = mapped_column(Integer)
    start_ms: Mapped[int] = mapped_column(Integer)
    end_ms: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(Text)
    speaker_label: Mapped[str] = mapped_column(String(255), default="Speaker")
    speaker_estimated: Mapped[bool] = mapped_column(Boolean, default=True)
    source_provider: Mapped[str] = mapped_column(String(64))

    recording = relationship("Recording", back_populates="transcript_segments")
