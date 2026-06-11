# AGENTS.md

## Project Context

Salin is a web-based recording-to-notes workspace for uploaded Tagalog, English, and Taglish audio or video files. The product focus is uploaded recordings only. Do not reframe it as a live meeting bot.

The core workflow is:

1. Upload a recording
2. Process it in the background
3. Render a timestamped transcript
4. Let the user review audio via clickable timestamps
5. Generate structured notes
6. Allow export

## Product Boundaries

Treat these as required product truths unless updated in docs:

- Speaker labels are estimated, not authoritative.
- Transcript review must remain useful even when diarization is imperfect.
- Notes are generated from stored transcript data, not directly from raw audio.
- Failed downstream steps must not force retranscription if transcript data already exists.
- Transcription must support a Groq-first path and a local backup mode that still produces the same canonical transcript contract.

Explicitly out of scope for v1:

- Live meeting bot behavior
- Realtime transcription
- Team accounts
- Billing and subscriptions
- Mobile apps
- Automatic identification of real speaker names

## Planned Stack

- Web: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui
- API: FastAPI
- Worker: Python
- Queue: Redis + RQ
- Database: local Postgres for development and v1 prototyping
- Storage: S3 compatible Cloudflare R2 for object storage
- Containerization: Dockerfiles for each app plus Docker Compose for local orchestration
- Audio tooling: `ffmpeg`
- Transcription: Groq Whisper as the primary provider, plus a local backup transcription mode behind the same interface
- Diarization: `pyannote.audio` first, WhisperX as fallback or prototype simplification
- Notes: provider abstraction behind a notes interface

Unknown implementation choices must stay marked as `TBD` until decided. Do not guess package managers, deployment target, auth provider, or production infrastructure.

## Important Paths

- `AGENTS.md`
- `docs/project-plan.md`
- `docs/architecture.md`
- `docs/setup.md`
- `docs/testing.md`
- `docs/tasks.md`
- `docs/ui.md`
- `infra/docker-compose.yml`
- `apps/web` for the Next.js app
- `apps/api` for the FastAPI service
- `apps/worker` for the background processing worker
- `packages/shared` for shared schemas or contracts if needed
- `infra` for Docker and local service orchestration

## Commands

Docker orchestration is part of the project definition:

- Start local stack: `docker compose -f infra/docker-compose.yml up --build`
- Stop local stack: `docker compose -f infra/docker-compose.yml down`

App-specific commands are not defined yet. Keep these as `TBD` until the repo is bootstrapped:

- Install: `TBD`
- Dev: `TBD`
- Build: `TBD`
- Lint: `TBD`
- Typecheck: `TBD`
- Test: `TBD`
- E2E: `TBD`

## Working Rules

Before editing code:

1. Read this file.
2. Read `docs/project-plan.md`.
3. Read `docs/architecture.md` for pipeline or storage changes.
4. Read `docs/setup.md` for local orchestration or environment changes.
5. Read `docs/testing.md` before changing validation scope.
6. Read `docs/tasks.md` when work spans multiple steps.

Make the smallest safe change that preserves the product boundaries above.

## Implementation Priorities

The first useful slice is a transcript-only vertical path:

1. Upload one supported recording
2. Create a persistent processing job
3. Normalize audio and transcribe it through the Groq-first provider path
4. Persist timestamped transcript blocks
5. Render the transcript in the web app

Do not start with diarization, exports, or complex auth unless the task explicitly requires them.

## UI Conventions

- Use shadcn/ui components before creating custom primitives.
- Keep the transcript workspace centered on reviewability: audio player, timestamps, speaker label, transcript text, notes panel.
- Speaker labels must be visually marked as estimated until edited.
- Use a clear disclaimer instead of overstating transcription or diarization quality.

## Testing Strategy

- Default to E2E coverage for user-facing flows.
- Prefer one focused happy path plus one meaningful failure path for each new user-visible milestone.
- Use integration tests for provider adapters, background job orchestration, and storage boundaries.
- Use unit tests only for complex pure logic such as timestamp alignment, transcript merging, and retry/backoff behavior.

## E2E Expectations

Before calling a milestone done, validate the relevant user flow end to end. Early milestones should cover:

- Upload supported recording -> processing job -> completed transcript view
- Unsupported file upload -> clear validation error
- Later milestones: timestamp seeking, notes generation, speaker edits, exports

## Documentation Rules

- Update `docs/project-plan.md` when scope or acceptance criteria change.
- Update `docs/architecture.md` for structural, storage, or provider-boundary changes.
- Update `docs/setup.md` when Docker services, local orchestration, or environment configuration changes.
- Update `docs/testing.md` when validation strategy or fixtures change.
- Update `docs/tasks.md` when tracked work starts, changes, or completes.
- Update `docs/ui.md` when screen structure, component conventions, or interaction rules change.
- Do not create placeholder docs that add no operational value.

## Done Criteria

A task is done only when:

1. The requested behavior is implemented or the planning artifact is fully updated.
2. Relevant validation has passed or skipped validation is explained precisely.
3. Related docs are updated when the change affects behavior, architecture, or testing.
4. The final report lists changed files, validation performed, and any required follow-up work.
