# Architecture

## Current Slice

Salin now has the transcript spine plus the first review-and-notes layer as a real multi-service repo:

- `apps/web`: Next.js App Router frontend
- `apps/api`: FastAPI upload and query API
- `apps/worker`: RQ worker for background preprocessing and transcription
- `packages/shared`: generated-type boundary plus typed fetch client for the web app
- `infra/docker-compose.yml`: local orchestration for `web`, `api`, `worker`, `postgres`, and `redis`

This slice now covers an upload-first dashboard, persistent jobs, canonical transcript segments, normalized-audio review, transcript search, transcript TXT export, manual notes generation, and structured notes editing. It still does not implement diarization, speaker editing, notes TXT export, PDF export, or combined export flows.

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

- Render the upload-first dashboard at `/`
- Render recent recordings history from `GET /recordings`
- Redirect to `/recordings/[id]` after upload
- Poll `GET /recordings/{id}` every 2 seconds until the transcript job and notes lifecycle reach terminal states
- Render recording detail header plus transcript/notes tabs
- Render normalized-audio review, timestamp seeking, transcript search, and transcript TXT export inside the transcript tab
- Render manual notes generation, regeneration, and structured notes editing without blocking transcript review
- Show retry affordance only when the API marks a failed job as retryable

### `apps/api`

- Accept multipart recording uploads
- Validate supported file types and size limit
- Store original uploads in Cloudflare R2
- Persist `Recording` and `ProcessingJob` rows
- Persist `GeneratedNotes` rows separately from transcript segments
- Return dashboard recording rows through `GET /recordings`
- Return recording/job state and transcript segments
- Return synthesized idle notes state when notes have not been generated yet
- Reset retryable failed jobs and re-enqueue them
- Queue manual notes generation requests against stored transcript data
- Persist structured notes edits through `PUT /recordings/{id}/notes`
- Export OpenAPI schema for the shared TypeScript client/types workflow

### `apps/worker`

- Download original upload from R2
- Normalize audio to mono 16 kHz with `ffmpeg`
- Upload normalized audio artifact back to R2
- Retry Groq transcription with bounded backoff
- Fall back to `faster-whisper` when Groq fails
- Persist raw provider artifact JSON and canonical transcript segments
- Mark job state transitions in Postgres
- Generate structured notes from stored transcript segments through the OpenRouter provider boundary
- Preserve completed transcript data even when notes generation fails

### `packages/shared`

- Hold generated API-facing TypeScript types
- Hold the shared typed fetch client consumed by the web app

## Database Shape

Current tables:

- `recordings`
- `processing_jobs`
- `transcript_segments`
- `generated_notes`

The current schema still omits diarization, speaker-edit operations, export, and chunk metadata tables.

The API currently initializes tables with `Base.metadata.create_all(...)` on startup. Proper migrations can be added once the schema stabilizes beyond the transcript spine.

## Storage Layout

Current object keys:

- `recordings/{id}/original/{filename}`
- `recordings/{id}/normalized/audio.wav`
- `recordings/{id}/artifacts/{provider}-raw.json`

Canonical persisted transcript segments stay in Postgres, not in provider-specific JSON.

Notes stay in Postgres as separate structured content so notes retries and failures do not disturb transcript rows.

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

## Notes Lifecycle

`generated_notes` stores:

- `status`: `idle`, `queued`, `generating`, `completed`, or `failed`
- `summary`
- `key_points`
- `decisions`
- `action_items`
- `questions`
- `error_message`
- `source_provider`
- `generation_count`
- `started_at`
- `completed_at`
- `updated_at`

The transcript job remains transcript-only. Notes generation is queued manually after transcript completion, and the last successful notes remain visible during regeneration attempts.

Structured notes edits are saved back into the same `generated_notes` row shape so note cleanup does not require regeneration.

## Provider Boundaries

The worker owns provider-specific logic behind explicit interfaces:

- `GroqTranscriptionProvider`
- `FasterWhisperTranscriptionProvider`
- `OpenRouterNotesProvider`

The rest of the system only consumes canonical transcript segments and job state, not provider response shapes.

## Job Lifecycle

Current stages:

- `uploaded`
- `preprocessing`
- `transcribing`
- `completed`
- `failed`

Current rules:

- Long-running work never runs inside the upload request.
- Transcript work is reusable after downstream failures because raw artifacts and transcript segments persist separately.
- Notes generation is a separate persisted lifecycle and does not mutate transcript job stages.
- Notes failures do not require retranscription and do not delete transcript segments.
- Recording `updated_at` is intentionally touched by transcript and notes lifecycle changes so the dashboard history reflects recent workspace activity rather than upload time alone.
- Chunking is intentionally deferred. Oversized normalized audio fails with a clear milestone-boundary error.
