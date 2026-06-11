from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from salin_api.db.base import Base


class Recording(Base):
    __tablename__ = "recordings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    filename: Mapped[str] = mapped_column(String(255))
    content_type: Mapped[str] = mapped_column(String(255))
    file_size: Mapped[int] = mapped_column(Integer)
    language: Mapped[str] = mapped_column(String(20))
    processing_mode: Mapped[str] = mapped_column(String(20))
    speaker_count: Mapped[str] = mapped_column(String(20))
    original_object_key: Mapped[str] = mapped_column(String(512))
    normalized_object_key: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    job = relationship("ProcessingJob", back_populates="recording", uselist=False)
    transcript_segments = relationship(
        "TranscriptSegment",
        back_populates="recording",
        order_by="TranscriptSegment.index",
    )
