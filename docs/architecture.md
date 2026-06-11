# Architecture

## Current Slice

Salin now has the phase 1 transcript spine scaffolded as a real multi-service repo:

- `apps/web`: Next.js App Router frontend
- `apps/api`: FastAPI upload and query API
- `apps/worker`: RQ worker for background preprocessing and transcription
- `packages/shared`: generated-type boundary plus typed fetch client for the web app
- `infra/docker-compose.yml`: local orchestration for `web`, `api`, `worker`, `postgres`, and `redis`

This slice is intentionally limited to uploaded recordings, persistent jobs, canonical transcript segments, and a poll-based transcript workspace. It does not implement diarization, notes generation, exports, transcript search, or timestamp seeking yet.

## System Overview

```text
[Next.js Web]
    |
    v
[FastAPI API] ---> [Postgres]
    |                 ^
    |                 |
    +--> [Cloudflare R2]
    |
    +--> [Redis Queue] ---> [RQ Worker]
                               |
                               +--> ffmpeg
                               +--> Groq Whisper
                               +--> faster-whisper fallback
```

## Repository Shape

```text
salin/
  apps/
    web/
    api/
    worker/
  packages/
    shared/
  infra/
  docs/
```

## Responsibilities

### `apps/web`

- Render upload form at `/`
- Redirect to `/recordings/[id]` after upload
- Poll `GET /recordings/{id}` every 2 seconds until terminal state
- Render transcript blocks and right-rail job metadata
- Show retry affordance only when the API marks a failed job as retryable

### `apps/api`

- Accept multipart recording uploads
- Validate supported file types and size limit
- Store original uploads in Cloudflare R2
- Persist `Recording` and `ProcessingJob` rows
- Return recording/job state and transcript segments
- Reset retryable failed jobs and re-enqueue them
- Export OpenAPI schema for the shared TypeScript client/types workflow

### `apps/worker`

- Download original upload from R2
- Normalize audio to mono 16 kHz with `ffmpeg`
- Upload normalized audio artifact back to R2
- Retry Groq transcription with bounded backoff
- Fall back to `faster-whisper` when Groq fails
- Persist raw provider artifact JSON and canonical transcript segments
- Mark job state transitions in Postgres

### `packages/shared`

- Hold generated API-facing TypeScript types
- Hold the shared typed fetch client consumed by the web app

## Database Shape

Current tables:

- `recordings`
- `processing_jobs`
- `transcript_segments`

The phase 1 schema intentionally omits diarization, notes, export, and chunk metadata tables.

The API currently initializes tables with `Base.metadata.create_all(...)` on startup. Proper migrations can be added once the schema stabilizes beyond the transcript spine.

## Storage Layout

Current object keys:

- `recordings/{id}/original/{filename}`
- `recordings/{id}/normalized/audio.wav`
- `recordings/{id}/artifacts/{provider}-raw.json`

Canonical persisted transcript segments stay in Postgres, not in provider-specific JSON.

## Canonical Transcript Contract

Each transcript segment persists:

- `id`
- `recording_id`
- `index`
- `start_ms`
- `end_ms`
- `text`
- `speaker_label`
- `speaker_estimated`
- `source_provider`

For this milestone, `speaker_label` is always `"Speaker"` and `speaker_estimated` is always `true`.

## Provider Boundaries

The worker owns provider-specific logic behind explicit interfaces:

- `GroqTranscriptionProvider`
- `FasterWhisperTranscriptionProvider`
- `OpenRouterNotesProvider` stubbed as a future boundary

The rest of the system only consumes canonical transcript segments and job state, not provider response shapes.

## Job Lifecycle

Current stages:

- `uploaded`
- `preprocessing`
- `transcribing`
- `completed`
- `failed`

Phase 1 rules:

- Long-running work never runs inside the upload request.
- Transcript work is reusable after downstream failures because raw artifacts and transcript segments persist separately.
- Notes are not generated yet, but the provider boundary is locked to OpenRouter for the next milestone.
- Chunking is intentionally deferred. Oversized normalized audio fails with a clear milestone-boundary error.
