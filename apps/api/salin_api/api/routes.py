from __future__ import annotations

import json
from pathlib import Path
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from fastapi.responses import PlainTextResponse, Response
from sqlalchemy.orm import Session

from salin_api.repositories.recordings import RecordingRepository
from salin_api.schemas.recordings import (
    ArtifactUrls,
    GeneratedNotesSummary,
    LanguageOption,
    NotesGenerationResponse,
    NotesStatus,
    NotesUpdateRequest,
    ProcessingJobSummary,
    ProcessingMode,
    RecordingCreateResponse,
    RecordingDetailResponse,
    RecordingListItemSummary,
    RecordingListResponse,
    RecordingRenameRequest,
    RecordingSummary,
    RetryResponse,
    SegmentUpdateRequest,
    SpeakerCount,
    SpeakerRenameRequest,
    TranscriptSegmentSummary,
    TranscriptSegmentsUpdateResponse,
)
from salin_api.services.exports import (
    BinaryExport,
    TextExport,
    build_combined_pdf,
    build_combined_txt,
    build_notes_pdf,
    build_notes_txt,
    build_transcript_pdf,
    build_transcript_txt,
    notes_is_exportable,
)

SUPPORTED_EXTENSIONS = {".mp3", ".wav", ".m4a", ".aac", ".mp4", ".mov", ".webm"}

router = APIRouter()


def get_session(request: Request) -> Session:
    session = request.app.state.session_factory()
    try:
        yield session
    finally:
        session.close()


SessionDep = Annotated[Session, Depends(get_session)]
RecordingFile = Annotated[UploadFile, File(...)]
LanguageForm = Annotated[LanguageOption, Form(...)]
ProcessingModeForm = Annotated[ProcessingMode, Form(...)]
SpeakerCountForm = Annotated[SpeakerCount, Form(...)]


def sanitize_filename(filename: str) -> str:
    return Path(filename).name.replace(" ", "-")


def ensure_supported_file(filename: str) -> None:
    suffix = Path(filename).suffix.lower()
    if suffix not in SUPPORTED_EXTENSIONS:
        supported = ", ".join(sorted(SUPPORTED_EXTENSIONS))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Supported formats: {supported}.",
        )


def build_notes_summary(notes) -> GeneratedNotesSummary:
    if notes is None:
        return GeneratedNotesSummary(
            status=NotesStatus.IDLE,
            content=None,
            error_message=None,
            source_provider=None,
            generation_count=0,
            started_at=None,
            completed_at=None,
            updated_at=None,
        )

    return GeneratedNotesSummary(
        status=NotesStatus(notes.status),
        content=notes.content,
        error_message=notes.error_message,
        source_provider=notes.source_provider,
        generation_count=notes.generation_count,
        started_at=notes.started_at,
        completed_at=notes.completed_at,
        updated_at=notes.updated_at,
    )


def build_text_export_response(export: TextExport) -> PlainTextResponse:
    return PlainTextResponse(
        export.content,
        headers={"Content-Disposition": f'attachment; filename="{export.filename}"'},
    )


def build_binary_export_response(export: BinaryExport) -> Response:
    return Response(
        export.content,
        media_type=export.media_type,
        headers={"Content-Disposition": f'attachment; filename="{export.filename}"'},
    )


@router.post(
    "/recordings",
    response_model=RecordingCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_recording(
    request: Request,
    file: RecordingFile,
    language: LanguageForm,
    processing_mode: ProcessingModeForm,
    speaker_count: SpeakerCountForm,
    session: SessionDep,
) -> RecordingCreateResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="A filename is required.")

    ensure_supported_file(file.filename)
    payload = await file.read()
    max_bytes = request.app.state.settings.max_upload_mb * 1024 * 1024
    if len(payload) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"Upload exceeds the {request.app.state.settings.max_upload_mb} MB limit.",
        )

    recording_id = str(uuid4())
    job_id = str(uuid4())
    normalized_name = sanitize_filename(file.filename)
    object_key = f"recordings/{recording_id}/original/{normalized_name}"
    content_type = file.content_type or "application/octet-stream"
    repository = RecordingRepository(session)

    request.app.state.services.storage.upload_bytes(object_key, payload, content_type)
    recording, job = repository.create_recording_with_job(
        recording_id=recording_id,
        filename=normalized_name,
        content_type=content_type,
        file_size=len(payload),
        language=language.value,
        processing_mode=processing_mode.value,
        speaker_count=speaker_count.value,
        original_object_key=object_key,
        job_id=job_id,
    )

    try:
        request.app.state.services.job_queue.enqueue_recording(recording_id)
    except Exception as exc:  # pragma: no cover - exercised via integration behavior
        job = repository.mark_job_failed(
            recording_id,
            error_message="Recording saved but could not be queued for processing.",
            retryable=True,
        )
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return RecordingCreateResponse(
        recording=RecordingSummary.model_validate(recording),
        job=ProcessingJobSummary.model_validate(job),
    )


@router.get("/recordings", response_model=RecordingListResponse)
def list_recordings(
    session: SessionDep,
) -> RecordingListResponse:
    repository = RecordingRepository(session)
    rows = repository.list_recordings()
    return RecordingListResponse(
        recordings=[
            RecordingListItemSummary(
                recording=RecordingSummary.model_validate(recording),
                job=ProcessingJobSummary.model_validate(job),
                notes=build_notes_summary(notes),
            )
            for recording, job, notes in rows
        ]
    )


@router.get("/recordings/{recording_id}", response_model=RecordingDetailResponse)
def get_recording(
    recording_id: str,
    request: Request,
    session: SessionDep,
) -> RecordingDetailResponse:
    repository = RecordingRepository(session)
    recording = repository.get_recording(recording_id)
    job = repository.get_job(recording_id)
    if recording is None or job is None:
        raise HTTPException(status_code=404, detail="Recording not found.")

    segments = repository.list_segments(recording_id)
    notes = repository.get_generated_notes(recording_id)
    artifact_urls = ArtifactUrls(
        original=request.app.state.services.storage.presign_get(recording.original_object_key),
        normalized=(
            request.app.state.services.storage.presign_get(recording.normalized_object_key)
            if recording.normalized_object_key
            else None
        ),
    )
    if artifact_urls.normalized is None:
        artifact_urls = ArtifactUrls(original=artifact_urls.original)

    return RecordingDetailResponse(
        recording=RecordingSummary.model_validate(recording),
        job=ProcessingJobSummary.model_validate(job),
        transcript_segments=[
            TranscriptSegmentSummary.model_validate(segment) for segment in segments
        ],
        artifact_urls=artifact_urls,
        notes=build_notes_summary(notes),
    )


@router.put("/recordings/{recording_id}/rename", response_model=RecordingDetailResponse)
def rename_recording(
    recording_id: str,
    payload: RecordingRenameRequest,
    request: Request,
    session: SessionDep,
) -> RecordingDetailResponse:
    repository = RecordingRepository(session)
    recording = repository.get_recording(recording_id)
    job = repository.get_job(recording_id)
    if recording is None or job is None:
        raise HTTPException(status_code=404, detail="Recording not found.")

    filename = payload.filename.strip()
    if not filename:
        raise HTTPException(status_code=400, detail="Filename cannot be empty.")

    recording = repository.rename_recording(recording_id, filename)

    segments = repository.list_segments(recording_id)
    notes = repository.get_generated_notes(recording_id)
    artifact_urls = ArtifactUrls(
        original=request.app.state.services.storage.presign_get(recording.original_object_key),
        normalized=(
            request.app.state.services.storage.presign_get(recording.normalized_object_key)
            if recording.normalized_object_key
            else None
        ),
    )
    if artifact_urls.normalized is None:
        artifact_urls = ArtifactUrls(original=artifact_urls.original)

    return RecordingDetailResponse(
        recording=RecordingSummary.model_validate(recording),
        job=ProcessingJobSummary.model_validate(job),
        transcript_segments=[
            TranscriptSegmentSummary.model_validate(segment) for segment in segments
        ],
        artifact_urls=artifact_urls,
        notes=build_notes_summary(notes),
    )


@router.get("/recordings/{recording_id}/exports/transcript.txt")
def export_transcript_txt(recording_id: str, session: SessionDep) -> PlainTextResponse:
    repository = RecordingRepository(session)
    recording = repository.get_recording(recording_id)
    if recording is None:
        raise HTTPException(status_code=404, detail="Recording not found.")

    segments = repository.list_segments(recording_id)
    if not segments:
        raise HTTPException(
            status_code=409,
            detail="Transcript segments are required before export.",
        )

    return build_text_export_response(
        build_transcript_txt(recording=recording, segments=segments)
    )


@router.get("/recordings/{recording_id}/exports/transcript.pdf")
def export_transcript_pdf(recording_id: str, session: SessionDep) -> Response:
    repository = RecordingRepository(session)
    recording = repository.get_recording(recording_id)
    if recording is None:
        raise HTTPException(status_code=404, detail="Recording not found.")

    segments = repository.list_segments(recording_id)
    if not segments:
        raise HTTPException(
            status_code=409,
            detail="Transcript segments are required before export.",
        )

    return build_binary_export_response(
        build_transcript_pdf(recording=recording, segments=segments)
    )


@router.get("/recordings/{recording_id}/exports/notes.txt")
def export_notes_txt(recording_id: str, session: SessionDep) -> PlainTextResponse:
    repository = RecordingRepository(session)
    recording = repository.get_recording(recording_id)
    if recording is None:
        raise HTTPException(status_code=404, detail="Recording not found.")

    notes = repository.get_generated_notes(recording_id)
    if not notes_is_exportable(notes):
        raise HTTPException(
            status_code=409,
            detail="Completed notes are required before export.",
        )

    return build_text_export_response(build_notes_txt(recording=recording, notes=notes))


@router.get("/recordings/{recording_id}/exports/notes.pdf")
def export_notes_pdf(recording_id: str, session: SessionDep) -> Response:
    repository = RecordingRepository(session)
    recording = repository.get_recording(recording_id)
    if recording is None:
        raise HTTPException(status_code=404, detail="Recording not found.")

    notes = repository.get_generated_notes(recording_id)
    if not notes_is_exportable(notes):
        raise HTTPException(
            status_code=409,
            detail="Completed notes are required before export.",
        )

    return build_binary_export_response(build_notes_pdf(recording=recording, notes=notes))


@router.get("/recordings/{recording_id}/exports/combined.txt")
def export_combined_txt(recording_id: str, session: SessionDep) -> PlainTextResponse:
    repository = RecordingRepository(session)
    recording = repository.get_recording(recording_id)
    if recording is None:
        raise HTTPException(status_code=404, detail="Recording not found.")

    segments = repository.list_segments(recording_id)
    if not segments:
        raise HTTPException(
            status_code=409,
            detail="Transcript segments are required before export.",
        )

    notes = repository.get_generated_notes(recording_id)
    if not notes_is_exportable(notes):
        raise HTTPException(
            status_code=409,
            detail="Completed notes are required before export.",
        )

    return build_text_export_response(
        build_combined_txt(recording=recording, segments=segments, notes=notes)
    )


@router.get("/recordings/{recording_id}/exports/combined.pdf")
def export_combined_pdf(recording_id: str, session: SessionDep) -> Response:
    repository = RecordingRepository(session)
    recording = repository.get_recording(recording_id)
    if recording is None:
        raise HTTPException(status_code=404, detail="Recording not found.")

    segments = repository.list_segments(recording_id)
    if not segments:
        raise HTTPException(
            status_code=409,
            detail="Transcript segments are required before export.",
        )

    notes = repository.get_generated_notes(recording_id)
    if not notes_is_exportable(notes):
        raise HTTPException(
            status_code=409,
            detail="Completed notes are required before export.",
        )

    return build_binary_export_response(
        build_combined_pdf(recording=recording, segments=segments, notes=notes)
    )


@router.post("/recordings/{recording_id}/retry", response_model=RetryResponse)
def retry_recording(
    recording_id: str,
    request: Request,
    session: SessionDep,
) -> RetryResponse:
    repository = RecordingRepository(session)
    job = repository.get_job(recording_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Recording not found.")
    if job.stage != "failed" or not job.retryable:
        raise HTTPException(status_code=409, detail="Recording is not retryable.")

    updated_job = repository.reset_failed_job(recording_id)
    try:
        request.app.state.services.job_queue.enqueue_recording(recording_id)
    except Exception as exc:  # pragma: no cover - exercised via integration behavior
        updated_job = repository.mark_job_failed(
            recording_id,
            error_message="Retry requested but the job could not be re-queued.",
            retryable=True,
        )
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return RetryResponse(
        recording_id=recording_id,
        job=ProcessingJobSummary.model_validate(updated_job),
    )


@router.post(
    "/recordings/{recording_id}/notes/generate",
    response_model=NotesGenerationResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def generate_notes(
    recording_id: str,
    request: Request,
    session: SessionDep,
) -> NotesGenerationResponse:
    repository = RecordingRepository(session)
    recording = repository.get_recording(recording_id)
    job = repository.get_job(recording_id)
    if recording is None or job is None:
        raise HTTPException(status_code=404, detail="Recording not found.")
    if job.stage not in {"completed", "diarizing"}:
        raise HTTPException(
            status_code=409,
            detail="Transcript segments must be available before generating notes.",
        )

    segments = repository.list_segments(recording_id)
    if not segments:
        raise HTTPException(
            status_code=409,
            detail="Transcript segments are required before generating notes.",
        )

    existing_notes = repository.get_generated_notes(recording_id)
    if existing_notes and existing_notes.status in {"queued", "generating"}:
        raise HTTPException(
            status_code=409,
            detail="Notes generation is already in progress.",
        )

    queued_notes = repository.queue_notes_generation(recording_id)
    try:
        request.app.state.services.job_queue.enqueue_notes(recording_id)
    except Exception as exc:  # pragma: no cover - exercised via integration behavior
        queued_notes = repository.fail_notes_generation(
            recording_id,
            error_message="Notes requested but could not be queued for generation.",
        )
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return NotesGenerationResponse(
        recording_id=recording_id,
        notes=build_notes_summary(queued_notes),
    )


@router.put("/recordings/{recording_id}/notes", response_model=NotesGenerationResponse)
def update_notes(
    recording_id: str,
    payload: NotesUpdateRequest,
    session: SessionDep,
) -> NotesGenerationResponse:
    repository = RecordingRepository(session)
    recording = repository.get_recording(recording_id)
    if recording is None:
        raise HTTPException(status_code=404, detail="Recording not found.")

    saved_notes = repository.save_notes_edits(
        recording_id,
        content=payload.content,
    )
    return NotesGenerationResponse(
        recording_id=recording_id,
        notes=build_notes_summary(saved_notes),
    )


@router.put(
    "/recordings/{recording_id}/speakers/rename",
    response_model=TranscriptSegmentsUpdateResponse,
)
def rename_speaker(
    recording_id: str,
    payload: SpeakerRenameRequest,
    session: SessionDep,
) -> TranscriptSegmentsUpdateResponse:
    repository = RecordingRepository(session)
    from_label = payload.from_label.strip()
    to_label = payload.to_label.strip()
    if not from_label or not to_label:
        raise HTTPException(status_code=400, detail="Speaker labels cannot be empty.")

    try:
        segments = repository.rename_speaker(
            recording_id,
            from_label=from_label,
            to_label=to_label,
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return TranscriptSegmentsUpdateResponse(
        recording_id=recording_id,
        transcript_segments=[
            TranscriptSegmentSummary.model_validate(segment) for segment in segments
        ],
    )


@router.put(
    "/recordings/{recording_id}/transcript-segments/{segment_id}",
    response_model=TranscriptSegmentsUpdateResponse,
)
def update_segment(
    recording_id: str,
    segment_id: str,
    payload: SegmentUpdateRequest,
    session: SessionDep,
) -> TranscriptSegmentsUpdateResponse:
    repository = RecordingRepository(session)
    speaker_label = payload.speaker_label.strip()
    text = payload.text.strip()
    if not speaker_label:
        raise HTTPException(status_code=400, detail="Speaker label cannot be empty.")
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    try:
        segments = repository.update_segment(
            recording_id,
            segment_id=segment_id,
            speaker_label=speaker_label,
            text=text,
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return TranscriptSegmentsUpdateResponse(
        recording_id=recording_id,
        transcript_segments=[
            TranscriptSegmentSummary.model_validate(segment) for segment in segments
        ],
    )
