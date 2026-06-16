# Project Plan

## Project Check

- **Strongest part**: The product value is concrete and testable: convert uploaded recordings into reviewable transcript blocks and structured notes for Tagalog, English, and Taglish use cases.
- **Weakest assumption**: Acceptable Taglish transcription and usable speaker separation are assumed before a real evaluation set exists.
- **Likely scope creep**: Export polish, speaker-management tools, and account-level file management can expand faster than the transcript core.
- **Technical risk**: Diarization and transcript alignment are the hardest operational dependency, while Dockerized local orchestration plus Cloudflare R2 integration add setup complexity that must not leak into product logic.
- **Must prove first**: Upload one recording, process it in the background, store timestamped transcript blocks, and render them in a usable transcript view.
- **Should defer**: PDF polish, advanced speaker merging UX, and account management should wait until the transcript-only spine is reliable.

## Project Summary

Salin is a recording-to-notes workspace for uploaded audio and video files. It turns recordings into timestamped transcripts, estimated speaker-separated transcript blocks, and structured notes such as summaries, decisions, questions, and action items.

The product must be framed as a post-recording review tool. It is not a live meeting assistant.

## Target Users

### Primary

- Students reviewing lectures, interviews, and group discussions
- Small teams reviewing planning sessions, client calls, and internal discussions
- Filipino users working with Tagalog, English, and Taglish recordings

### Secondary

- Researchers conducting interviews
- Freelancers transcribing client calls
- Content creators extracting notes from conversations

## Core Problem

Users with long recordings need a faster way to review what happened, extract useful notes, and verify important points without replaying the entire file manually.

## Intended Outcome

After upload, a user should be able to:

1. See processing progress
2. Open a completed transcript
3. Click timestamps to verify statements against the original audio
4. Search the transcript and export it as TXT
5. Generate structured notes from the transcript
6. Correct estimated speaker labels
7. Export transcript and notes

## Product Promise

Upload a recording, get an estimated speaker-separated transcript, click timestamps to review the audio, and generate structured notes.

Required disclaimer:

`Speaker labels are automatically estimated and can be edited.`

## Scope

### First Implementation Slice

This is the first slice that must work before the rest of the scope matters:

- Upload one supported audio or video file
- Create a persistent processing job
- Store the original upload in Cloudflare R2
- Persist recording and job metadata in local Postgres
- Extract and normalize audio
- Transcribe using Groq Whisper with timestamps
- Keep transcript output canonical so local backup mode can replace Groq without changing downstream stages
- Persist transcript blocks
- Show job progress and completed transcript in the web UI

### Required for v1

- Audio and video uploads
- Background processing job with persistent status
- Cloudflare R2-backed object storage
- Local Postgres-backed application metadata
- Dockerized local development stack
- Audio extraction and 16 kHz mono normalization
- Chunking for long recordings
- Groq Whisper transcription with timestamps
- Local backup transcription mode using the same canonical transcript contract
- Chunk caching and retry for failed transcription chunks
- Estimated speaker diarization with editable labels that does not block transcript review after transcription succeeds
- Clickable transcript timestamps linked to audio playback
- Transcript search
- Notes generation from transcript
- TXT export for transcript and notes
- PDF export for transcript and notes

### Later

- Deletion workflows for recordings and transcripts
- Better processing push updates such as server-sent events
- More robust observability and job dashboards
- Alternate transcription and notes providers
- Optional promotion of local mode from backup-only to user-selectable processing mode
- Deeper evaluation tooling for multilingual quality comparisons

### Explicitly Out of Scope

- Live meeting bot behavior
- Realtime transcription
- Calendar integration
- Team accounts and collaboration
- Billing and subscriptions
- Mobile applications
- Automatic real-name speaker identification
- Legal-grade transcription guarantees

## Primary User Flow

1. User opens the upload page.
2. User uploads an audio or video file.
3. User chooses language, processing mode, and expected speaker count.
4. System creates a processing job, stores metadata in local Postgres, and stores the original file in Cloudflare R2.
5. Worker extracts audio, normalizes it, chunks if needed, and transcribes it.
6. If Groq is unavailable or intentionally bypassed, worker can switch to local backup transcription mode.
7. System stores transcript blocks immediately after transcription.
8. Worker runs diarization and updates speaker labels when it succeeds.
9. System stores generated notes separately from transcript blocks.
10. User opens the workspace, reviews transcript text, and seeks audio from timestamps.
11. User edits speaker labels and regenerates notes if needed.
12. User exports transcript and notes.

## Main Entities

- `User`
- `Recording`
- `ProcessingJob`
- `TranscriptSegment`
- `DiarizationSegment`
- `GeneratedNotes`

The canonical transcript representation should remain provider-agnostic.

## Acceptance Criteria

### First Slice Acceptance

- A supported recording can be uploaded from the web app.
- Upload returns quickly after creating a background processing job.
- Original upload artifacts are stored in Cloudflare R2.
- Recording and processing metadata persist in local Postgres.
- The worker persists stage updates through transcript completion.
- A completed recording shows timestamped transcript blocks in the UI.
- The stored transcript shape is identical whether produced by Groq or local backup mode.
- Unsupported file uploads fail with a clear message.

### v1 Acceptance

- A user can upload a 10 to 30 minute recording.
- The system produces timestamped transcript blocks.
- The user can click a timestamp and the audio seeks correctly.
- The system can estimate speaker labels for multi-speaker recordings.
- Transcript review remains available while speaker labels are still being estimated.
- The user can rename the recording session.
- The user can rename speakers and reassign blocks.
- The system can generate summary, decisions, action items, and questions.
- A failed notes step does not require retranscription.
- A failed transcription chunk can be retried independently.
- The system can complete transcription through local backup mode when Groq is unavailable.
- The user can export transcript and notes.

## Milestones

### Phase 1: Transcript-Only Prototype

- Upload UI
- Background job creation
- Cloudflare R2 upload persistence
- Local Postgres metadata persistence
- Audio extraction and normalization
- Groq transcription with timestamps
- Backup local transcription mode using the same provider contract
- Basic transcript viewer

### Phase 2: Clickable Transcript Workspace

- Audio player
- Timestamp seeking
- Transcript search
- Transcript block layout
- TXT export
- Status: Done

### Phase 3: Notes Generation

- Summary
- Key points
- Decisions
- Action items
- Questions
- Regenerate notes control
- Status: Done

### Phase 4: Speaker Diarization

- Diarization integration
- Speaker count handling
- Alignment to transcript
- Rename speaker
- Change block speaker
- Merge duplicate speaker labels
- Transcript remains visible while diarization runs
- Status: Done

### Phase 5: Export and Reliability Polish

- Chunked long-recording transcription (Done)
- Backend TXT export endpoints for transcript, notes, and combined text (Done)
- Backend PDF export endpoints for transcript, notes, and combined output (Done)
- Current-style export UI controls for transcript, notes, and combined TXT/PDF (Done)
- Export presentation polish for the UI revamp
- Retry/error-state UI polish for downstream failures
- Better processing progress presentation

## Open Questions

- JS package manager: `pnpm`
- Python dependency manager: `uv`
- Prototype auth model: `TBD`
- Initial deployment target: `TBD`
- Initial diarization implementation: `pyannote.audio` with `pyannote/speaker-diarization-community-1`
- Local transcription engine for backup mode: `faster-whisper`
- Notes provider choice and prompt ownership: OpenRouter provider implemented; prompt ownership `TBD`
