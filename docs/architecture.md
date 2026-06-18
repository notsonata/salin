# Architecture

## Current Slice

Salin now has the transcript spine plus the first review-and-notes layer as a real multi-service repo:

- `apps/web`: Next.js App Router frontend
- `apps/api`: FastAPI upload and query API
- `apps/worker`: RQ worker for background preprocessing and transcription
- `packages/shared`: generated-type boundary plus typed fetch client for the web app
- `infra/docker-compose.yml`: local orchestration for `web`, `api`, `worker`, `postgres`, and `redis`
- `infra/docker-compose.prod.yml`: single-Droplet production orchestration with
  Caddy routing browser-facing web and API traffic through ports `80` and `443`

This slice now covers an upload-first dashboard, public single-video YouTube URL import for presentation intake, persistent jobs, canonical transcript segments, normalized-audio review, transcript search, transcript TXT/PDF export controls, manual notes generation, Markdown notes editing, basic speaker correction workflows, non-blocking transcript-first diarization, configurable pyannote-backed diarization, chunked long-recording transcription, and backend TXT/PDF exports for transcript, notes, and a combined bundle.

## System Overview

```text
[Browser]
    |
    v
[Caddy production front door]
    |             |
    v             v
[Next.js Web]  [FastAPI API] ---> [Postgres]
                    |                 ^
                    |                 |
                    +--> [Cloudflare R2]
                    |
                    +--> [Redis Queue] ---> [RQ Worker]
                                               |
                                               +--> yt-dlp (YouTube import only)
                                               +--> ffmpeg
                                               +--> Groq Whisper
                                               +--> pyannote.audio diarization (optional)
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

- Render the product home at `/`
- Render the recording intake dashboard at `/dashboard`
- Render recent recordings history on `/library` from `GET /recordings`
- Delete a recording from `/library` after confirmation and remove the row once
  the API accepts the delete
- Redirect to `/workspace/{id}` after upload or YouTube import
- Poll `GET /recordings/{id}` every 2 seconds until the transcript job and notes lifecycle reach terminal states
- Render recording detail header plus transcript/notes tabs
- Render normalized-audio review, timestamp seeking, transcript search, and transcript TXT/PDF export links inside the transcript tab
- Keep transcript review visible while the worker is in the `diarizing` stage
- Render non-fatal processing notes such as local-backup fallback and diarization failure details
- Render estimated/edited speaker state, speaker rename, and per-block speaker reassignment controls inside the transcript tab
- Render manual notes generation, regeneration, and Markdown notes editing without blocking transcript review
- Render notes TXT/PDF and combined TXT/PDF export links once notes have completed
- Render a sidebar Settings popup backed by `GET /settings` for server-global capability state such as diarization availability
- Show retry affordance only when the API marks a failed job as retryable

### `apps/api`

- Return non-secret app settings through `GET /settings`, including whether
  server-global diarization is enabled
- Accept multipart recording uploads
- Accept public single-video YouTube import requests at `POST /recordings/imports/youtube`
- Validate supported file types and size limit
- Store original uploads and YouTube import descriptors in Cloudflare R2
- Persist `Recording` and `ProcessingJob` rows
- Persist `GeneratedNotes` rows separately from transcript segments
- Return dashboard recording rows through `GET /recordings`
- Return recording/job state and transcript segments
- Delete a recording through `DELETE /recordings/{id}` by removing stored
  artifacts under the recording prefix plus dependent job, transcript, and notes rows
- Return synthesized idle notes state when notes have not been generated yet
- Reset retryable failed jobs and re-enqueue them
- Queue manual notes generation requests against stored transcript data once segments exist, including during the `diarizing` stage
- Persist Markdown notes edits through `PUT /recordings/{id}/notes`
- Persist speaker rename and per-block speaker correction edits against transcript segments
- Export transcript TXT/PDF, notes TXT/PDF, and combined TXT/PDF from stored database rows without reprocessing audio
- Export OpenAPI schema for the shared TypeScript client/types workflow
- In production, receive browser traffic through Caddy-routed `/recordings`,
  `/docs`, `/redoc`, and `/openapi.json` paths instead of a public `:8000`
  browser API origin

### `apps/worker`

- Download original upload from R2
- Detect YouTube import descriptors, download audio with `yt-dlp`, store the downloaded audio as the recording's original artifact, and then continue through the normal processing path
- Try public YouTube downloads through an optional production PO-token provider
  with the `mweb` client, then through the Android player API without cookies
  while skipping the initial webpage/config requests that trigger Droplet bot
  checks; if that fails and a mounted `cookies.txt` file exists, stage it into a
  writable temp file and retry through the Android client
- Enable a Deno-backed JS challenge runtime, let `yt-dlp` choose the available format, and download in a single extraction pass for current Droplet bot-check recovery
- Pair a configured YouTube cookie file with an optional browser User-Agent and
  fail with a clear stale-cookie message when YouTube rejects the server session
- Normalize audio to mono 16 kHz with `ffmpeg`
- Upload normalized audio artifact back to R2
- Split normalized audio into overlapped transcription chunks when the recording exceeds the configured chunk length
- Retry Groq transcription with bounded backoff
- Cache completed chunk transcript artifacts so retries can resume without retranscribing completed chunks
- Merge chunk-relative timestamps back into recording-relative transcript segments
- Persist raw transcription provider artifact JSON
- Persist canonical transcript segments immediately after transcription
- Optionally run pyannote diarization after transcript persistence
- Persist raw diarization artifact JSON when a provider is configured
- Replace generic speaker labels with aligned estimated speaker labels when diarization succeeds
- Keep generic estimated speaker labels when diarization is not configured or fails
- Mark job state transitions in Postgres
- Generate Markdown structured notes from stored transcript segments through the OpenRouter provider boundary
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

The current schema still omits diarization, export, and chunk metadata tables. Basic speaker corrections are stored directly on transcript segment rows rather than in a separate speaker table.

The API currently initializes tables with `Base.metadata.create_all(...)` on startup. Proper migrations can be added once the schema stabilizes beyond the transcript spine.

## Storage Layout

Current object keys:

- `recordings/{id}/original/{filename}`
- `recordings/{id}/original/youtube-import.json` before a YouTube import is downloaded
- `recordings/{id}/normalized/audio.wav`
- `recordings/{id}/artifacts/{provider}-raw.json`
- `recordings/{id}/artifacts/youtube-import.json`
- `recordings/{id}/artifacts/transcription-chunks/chunk-{index}-result.json`

Canonical persisted transcript segments stay in Postgres, not in provider-specific JSON.

Chunk result artifacts store provider-neutral segment timestamps relative to each chunk plus the provider raw payload for that chunk. The final `{provider}-raw.json` artifact records the chunk map and source providers used for the merged transcript.

Notes stay in Postgres as separate Markdown content so notes retries and failures do not disturb transcript rows.

Deleting a recording removes the R2 object prefix `recordings/{id}/` before the
database rows are removed. The database cleanup deletes transcript segments,
generated notes, and the processing job before deleting the recording row.

For YouTube imports, the API first stores a small descriptor with content type `application/vnd.salin.youtube-import+json`. During `preprocessing`, the worker downloads the audio, uploads it to `recordings/{id}/original/{filename}`, updates the recording metadata to point at that audio file, and preserves a small import artifact for debugging.

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

When no diarization provider is configured, the processing path writes `"Speaker"` with `speaker_estimated` set to `true`. When a provider returns diarization spans, the worker applies a deterministic largest-overlap alignment helper and persists the aligned estimated speaker labels.

User speaker corrections update transcript segment rows directly and set `speaker_estimated` to `false`. Renaming a speaker label across the recording can also merge duplicate labels by renaming one label to an existing one.

## Notes Lifecycle

`generated_notes` stores:

- `status`: `idle`, `queued`, `generating`, `completed`, or `failed`
- `content`: generated or edited Markdown notes
- `error_message`
- `source_provider`
- `generation_count`
- `started_at`
- `completed_at`
- `updated_at`

The transcript job remains transcript-only. Notes generation is queued manually after transcript segments exist, and the last successful notes remain visible during regeneration attempts.

Notes edits are saved back into the same `generated_notes.content` field so note cleanup does not require regeneration.

## Provider Boundaries

The worker owns provider-specific logic behind explicit interfaces:

- `GroqTranscriptionProvider`
- `FasterWhisperTranscriptionProvider`
- `DiarizationProvider`
- `PyannoteDiarizationProvider`
- `OpenRouterNotesProvider`

The rest of the system only consumes canonical transcript segments and job state, not provider response shapes.

The diarization boundary defines provider-neutral speaker spans, artifact persistence, and transcript alignment. The first model-backed provider is `pyannote.audio`, using `pyannote/speaker-diarization-community-1` by default when `DIARIZATION_PROVIDER=pyannote` and `PYANNOTE_AUTH_TOKEN` are configured.

## Job Lifecycle

Current stages:

- `uploaded`
- `preprocessing`
- `transcribing`
- `diarizing`
- `completed`
- `failed`

Current rules:

- Long-running work never runs inside the upload request.
- Transcript segments persist before diarization starts, so transcript review does not wait for speaker estimation.
- Transcript work is reusable after downstream failures because raw artifacts and transcript segments persist separately.
- Groq fallback to local transcription is recorded as a non-fatal processing note on the job while the local provider runs and after completion.
- Diarization failure is recorded as a non-fatal processing note and leaves the transcript completed with generic estimated speaker labels.
- Notes generation is a separate persisted lifecycle and does not mutate transcript job stages.
- Notes failures do not require retranscription and do not delete transcript segments.
- TXT and PDF exports are synchronous API responses generated from stored transcript and notes rows. They do not enqueue worker jobs and do not call transcription or notes providers.
- Recording `updated_at` is intentionally touched by transcript and notes lifecycle changes so the dashboard history reflects recent workspace activity rather than upload time alone.
- Recording jobs are enqueued with an explicit long-running timeout through `RECORDING_JOB_TIMEOUT_SECONDS` so local fallback transcription and optional diarization are not killed by RQ's 180 second default.
- Notes jobs use a separate `NOTES_JOB_TIMEOUT_SECONDS` timeout because they are downstream and should remain shorter-lived.
- Long recordings use `TRANSCRIPTION_CHUNK_MINUTES` plus `TRANSCRIPTION_CHUNK_OVERLAP_SECONDS` to keep provider requests bounded. During processing, the job note can show progress such as `Transcribing chunk 3/12`.
- If a chunk has already written its result artifact, a retry reuses that chunk and continues with the first missing chunk.
