from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class LanguageOption(StrEnum):
    AUTO = "auto"
    TL = "tl"
    EN = "en"


class ProcessingMode(StrEnum):
    FAST = "fast"
    ACCURATE = "accurate"


class SpeakerCount(StrEnum):
    AUTO = "auto"
    ONE = "1"
    TWO = "2"
    THREE = "3"
    FOUR = "4"
    FIVE_PLUS = "5_plus"


class JobStage(StrEnum):
    UPLOADED = "uploaded"
    PREPROCESSING = "preprocessing"
    TRANSCRIBING = "transcribing"
    DIARIZING = "diarizing"
    COMPLETED = "completed"
    FAILED = "failed"


class NotesStatus(StrEnum):
    IDLE = "idle"
    QUEUED = "queued"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"


class RecordingSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    filename: str
    content_type: str
    file_size: int
    language: LanguageOption
    processing_mode: ProcessingMode
    speaker_count: SpeakerCount
    created_at: datetime
    updated_at: datetime


class ProcessingJobSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    recording_id: str
    stage: JobStage
    retryable: bool
    retry_count: int
    error_message: str | None
    last_provider: str | None
    created_at: datetime
    updated_at: datetime
    started_at: datetime | None
    completed_at: datetime | None


class TranscriptSegmentSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    recording_id: str
    index: int
    start_ms: int
    end_ms: int
    text: str
    speaker_label: str
    speaker_estimated: bool
    source_provider: str


class ArtifactUrls(BaseModel):
    original: str | None = None
    normalized: str | None = None


class GeneratedNotesSummary(BaseModel):
    status: NotesStatus
    content: str | None
    error_message: str | None
    source_provider: str | None
    generation_count: int
    started_at: datetime | None
    completed_at: datetime | None
    updated_at: datetime | None


class RecordingCreateResponse(BaseModel):
    recording: RecordingSummary
    job: ProcessingJobSummary


class RecordingDetailResponse(BaseModel):
    recording: RecordingSummary
    job: ProcessingJobSummary
    transcript_segments: list[TranscriptSegmentSummary]
    artifact_urls: ArtifactUrls | None = None
    notes: GeneratedNotesSummary


class RecordingListItemSummary(BaseModel):
    recording: RecordingSummary
    job: ProcessingJobSummary
    notes: GeneratedNotesSummary


class RecordingListResponse(BaseModel):
    recordings: list[RecordingListItemSummary]


class RetryResponse(BaseModel):
    recording_id: str
    job: ProcessingJobSummary


class NotesGenerationResponse(BaseModel):
    recording_id: str
    notes: GeneratedNotesSummary


class NotesUpdateRequest(BaseModel):
    content: str | None


class RecordingRenameRequest(BaseModel):
    filename: str = Field(min_length=1, max_length=1024)


class SpeakerRenameRequest(BaseModel):
    from_label: str = Field(min_length=1, max_length=255)
    to_label: str = Field(min_length=1, max_length=255)


class SegmentUpdateRequest(BaseModel):
    speaker_label: str = Field(min_length=1, max_length=255)
    text: str = Field(min_length=1)


class TranscriptSegmentsUpdateResponse(BaseModel):
    recording_id: str
    transcript_segments: list[TranscriptSegmentSummary]
