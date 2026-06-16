# Salin

Salin is a recording-to-notes workspace for uploaded audio and video files, focused on Tagalog, English, and Taglish recordings.

The current implementation includes the transcript spine plus the first review and
notes workspace:

- Upload one supported recording
- Persist the original file in Cloudflare R2
- Create a persistent background job in Postgres + Redis/RQ
- Normalize audio with `ffmpeg`
- Transcribe through Groq first, with `faster-whisper` as fallback
- Persist canonical timestamped transcript segments
- Render an upload-first dashboard with recent recordings
- Render a tabbed recording detail workspace with transcript and notes sections
- Review normalized audio through clickable transcript timestamps
- Search and export the transcript as TXT/PDF
- Generate, edit, and save structured notes from stored transcript data
- Estimate speaker labels with pyannote when configured, without blocking transcript review
- Process long recordings through retryable transcription chunks
- Export transcript, notes, and a combined bundle as backend-generated TXT/PDF files

## Current Scope

Implemented now:

- Next.js web app for upload, dashboard history, transcript review, and notes editing
- FastAPI API for upload, status, transcript fetch, retry, recordings list, notes generation, and notes edits
- Python worker for background preprocessing, transcription, chunking, diarization, and notes generation
- Shared TypeScript API client and generated types boundary
- Docker Compose stack for `web`, `api`, `worker`, `postgres`, and `redis`

Deferred to later milestones:

- Export presentation polish
- Full UI/UX revamp

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
- `TRANSCRIPTION_CHUNK_MINUTES`
- `TRANSCRIPTION_CHUNK_OVERLAP_SECONDS`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODELS`
- `MAX_UPLOAD_MB`
- `NEXT_PUBLIC_API_BASE_URL`
- `SALIN_API_INTERNAL_BASE_URL`

See [`.env.example`](.env.example) for the full contract.

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

Use the default repo startup script:

```bash
./run.sh
```

Use the macOS host-only presentation path without Docker:

```bash
sh ./run-local.sh
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

On macOS, `./run.sh` starts `web`, `api`, `postgres`, and `redis` in Docker and runs the worker directly on the host so diarization can use host-only backends like `mps`. That host-worker path uses RQ's `rq.worker.SpawnWorker` to avoid macOS `fork()` crashes from Objective-C backed libraries. On non-macOS hosts, `./run.sh` keeps using the full Docker Compose stack.
For the macOS host worker, `./run.sh` prefers `uv`, then `python3 -m uv`, and finally falls back to `.venv-tooling/bin/rq` if that repo-local tooling environment exists. When `DIARIZATION_PROVIDER=pyannote`, that fallback path will bootstrap the worker dependencies into `.venv-tooling` if `pyannote.audio` is missing.
For presentation on an Apple Silicon Mac, prefer `sh ./run-local.sh` with local Postgres and Redis running through Homebrew. That path keeps Docker off and leaves `PYANNOTE_DEVICE=auto` available for `mps`.

## API Surface

Current endpoints:

- `POST /recordings`
- `GET /recordings`
- `GET /recordings/{recording_id}`
- `POST /recordings/{recording_id}/retry`
- `POST /recordings/{recording_id}/notes/generate`
- `PUT /recordings/{recording_id}/notes`
- `GET /recordings/{recording_id}/exports/transcript.txt`
- `GET /recordings/{recording_id}/exports/transcript.pdf`
- `GET /recordings/{recording_id}/exports/notes.txt`
- `GET /recordings/{recording_id}/exports/notes.pdf`
- `GET /recordings/{recording_id}/exports/combined.txt`
- `GET /recordings/{recording_id}/exports/combined.pdf`

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

- API integration tests for upload validation, job creation, dashboard history, notes queueing, and notes edits
- Worker integration tests for canonical transcript persistence, Groq fallback, chunk merging/retry, diarization isolation, and notes generation failure isolation
- Playwright coverage for the dashboard, upload-to-transcript flow, timestamp seeking, transcript export, notes generation, notes failure, notes edits, and unsupported upload

See [docs/testing.md](docs/testing.md) for current commands and known environment limits.

## Important Notes

- Transcript segments are canonicalized before persistence.
- Speaker labels are automatically estimated until edited by the user.
- Notes are generated from stored transcript segments through the OpenRouter provider boundary.
- Notes failures do not require retranscription and do not delete transcript data.
- Long recordings are chunked with overlap and cached per chunk for retry.
- TXT and PDF exports are generated from stored rows and do not re-run transcription or notes generation.

## Docs

- [Project Plan](docs/project-plan.md)
- [Architecture](docs/architecture.md)
- [Setup](docs/setup.md)
- [Testing](docs/testing.md)
- [UI Conventions](docs/ui.md)
- [Tasks](docs/tasks.md)
