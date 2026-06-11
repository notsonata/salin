# Salin

Salin is a recording-to-notes workspace for uploaded audio and video files, focused on Tagalog, English, and Taglish recordings.

The current implementation is the phase 1 transcript spine:

- Upload one supported recording
- Persist the original file in Cloudflare R2
- Create a persistent background job in Postgres + Redis/RQ
- Normalize audio with `ffmpeg`
- Transcribe through Groq first, with `faster-whisper` as fallback
- Persist canonical timestamped transcript segments
- Render a poll-based transcript workspace in the web app

## Current Scope

Implemented now:

- Next.js web app for upload and transcript review
- FastAPI API for upload, status, transcript fetch, and retry
- Python worker for background preprocessing and transcription
- Shared TypeScript API client and generated types boundary
- Docker Compose stack for `web`, `api`, `worker`, `postgres`, and `redis`

Deferred to later milestones:

- Diarization and speaker editing workflows
- Notes generation through OpenRouter
- Audio playback and timestamp seeking
- Transcript search
- TXT/PDF export
- Chunking for long recordings

## Stack

- Web: Next.js App Router, React, TypeScript, Tailwind CSS
- API: FastAPI, SQLAlchemy
- Worker: Python, RQ, `ffmpeg`
- Queue: Redis
- Database: Postgres
- Object storage: Cloudflare R2
- Transcription: Groq Whisper, `faster-whisper` fallback

## Repo Layout

```text
salin/
  apps/
    web/       # Next.js frontend
    api/       # FastAPI service
    worker/    # RQ background worker
  packages/
    shared/    # shared TS client and generated API types
  infra/       # Docker Compose
  docs/        # project docs
```

## Requirements

- Docker
- Node.js 20+
- Python 3.12+
- `pnpm`
- `uv`

## Environment

Create a local env file from the template:

```bash
cp .env.example .env
```

The key variables are:

- `DATABASE_URL`
- `REDIS_URL`
- `R2_BUCKET_NAME`
- `R2_ENDPOINT_URL`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_REGION`
- `GROQ_API_KEY`
- `GROQ_TRANSCRIPTION_MODEL`
- `GROQ_FAST_MODEL`
- `LOCAL_TRANSCRIPTION_MODEL`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODELS`
- `MAX_UPLOAD_MB`
- `NEXT_PUBLIC_API_BASE_URL`
- `SALIN_API_INTERNAL_BASE_URL`

See [.env.example](/Users/angelo/Projects/Personal/salin/.env.example) for the full contract.

## Install

JavaScript dependencies:

```bash
pnpm install
```

Python dependencies:

```bash
uv sync --all-packages --dev
```

## Run

Start the full local stack:

```bash
docker compose -f infra/docker-compose.yml up --build
```

Stop it:

```bash
docker compose -f infra/docker-compose.yml down
```

Run services directly instead of Compose:

```bash
pnpm --filter @salin/web dev
uv run --package salin-api uvicorn salin_api.main:app --reload --host 0.0.0.0 --port 8000
uv run --package salin-worker rq worker salin-recordings --url redis://localhost:6379/0
```

## API Surface

Current endpoints:

- `POST /recordings`
- `GET /recordings/{recording_id}`
- `POST /recordings/{recording_id}/retry`

Supported upload formats:

- `.mp3`
- `.wav`
- `.m4a`
- `.aac`
- `.mp4`
- `.mov`
- `.webm`

## Useful Commands

Root scripts:

```bash
pnpm -r build
pnpm -r lint
pnpm -r typecheck
pnpm -r test
python3 apps/api/scripts/export_openapi.py
pnpm --filter @salin/shared generate
docker compose -f infra/docker-compose.yml build
```

## Validation

The repo includes:

- API integration tests for upload validation and job creation
- Worker integration tests for canonical transcript persistence and Groq fallback
- Playwright coverage for the upload-to-transcript web flow

See [docs/testing.md](/Users/angelo/Projects/Personal/salin/docs/testing.md) for current commands and known environment limits.

## Important Notes

- Transcript segments are canonicalized before persistence.
- Phase 1 speaker labels are always generic and marked as estimated.
- Notes are intentionally not generated yet, but the provider boundary is reserved for OpenRouter.
- Long recordings are not chunked yet; oversized normalized audio fails with a milestone-boundary error.

## Docs

- [Project Plan](/Users/angelo/Projects/Personal/salin/docs/project-plan.md)
- [Architecture](/Users/angelo/Projects/Personal/salin/docs/architecture.md)
- [Setup](/Users/angelo/Projects/Personal/salin/docs/setup.md)
- [Testing](/Users/angelo/Projects/Personal/salin/docs/testing.md)
- [UI Conventions](/Users/angelo/Projects/Personal/salin/docs/ui.md)
- [Tasks](/Users/angelo/Projects/Personal/salin/docs/tasks.md)
