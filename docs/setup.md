# Setup

## Prerequisites

- Docker
- Node.js 20+
- Python 3.12+
- `pnpm` via Corepack
- `uv`

Install local toolchain if needed:

```bash
corepack enable
corepack prepare pnpm@9.15.4 --activate
python3 -m pip install uv
```

## Environment

Start from the checked-in template:

```bash
cp .env.example .env
```

Required values:

- `DATABASE_URL`
- `REDIS_URL`
- `CORS_ALLOWED_ORIGINS`
- `R2_BUCKET_NAME`
- `R2_ENDPOINT_URL`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_REGION`
- `GROQ_API_KEY`
- `GROQ_TRANSCRIPTION_MODEL`
- `GROQ_FAST_MODEL`
- `LOCAL_TRANSCRIPTION_MODEL`
- `RECORDING_JOB_TIMEOUT_SECONDS`
- `NOTES_JOB_TIMEOUT_SECONDS`
- `MAX_UPLOAD_MB`
- `NEXT_PUBLIC_API_BASE_URL`
- `SALIN_API_INTERNAL_BASE_URL`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODELS`

Optional diarization values:

- `DIARIZATION_PROVIDER`: use `none` or `pyannote`
- `PYANNOTE_AUTH_TOKEN`: required only when `DIARIZATION_PROVIDER=pyannote`
- `PYANNOTE_MODEL`: defaults to `pyannote/speaker-diarization-community-1`
- `PYANNOTE_DEVICE`: use `auto`, `cpu`, or `cuda`
- `PYANNOTE_METRICS_ENABLED`: defaults to `0` in the template

## Install

JavaScript workspace:

```bash
pnpm install
```

Python workspace:

```bash
uv sync --all-packages --dev
```

## Local Development

Full stack through Docker Compose:

```bash
docker compose -f infra/docker-compose.yml up --build
```

Stop the stack:

```bash
docker compose -f infra/docker-compose.yml down
```

Run services directly without Compose:

```bash
pnpm --filter @salin/web dev
uv run --package salin-api uvicorn salin_api.main:app --reload --host 0.0.0.0 --port 8000
uv run --package salin-worker rq worker salin-recordings --url redis://localhost:6379/0
```

## OpenAPI and Shared Types

Export the API schema:

```bash
python3 apps/api/scripts/export_openapi.py
```

Regenerate shared TypeScript types:

```bash
pnpm --filter @salin/shared generate
```

## Service Notes

- The worker image includes `ffmpeg`.
- The web app uses `NEXT_PUBLIC_API_BASE_URL` in the browser and `SALIN_API_INTERNAL_BASE_URL` for server-side paths.
- `CORS_ALLOWED_ORIGINS` must include the browser-facing web origin, which is `http://localhost:3000` for the default Docker Compose setup.
- Cloudflare R2 remains the source of truth for original, normalized, and raw-provider artifacts.
- The phase 1 worker supports Groq-first transcription with `faster-whisper` fallback.
- Diarization is disabled by default. To enable pyannote-backed diarization, accept the selected model's Hugging Face conditions, create a token, set `DIARIZATION_PROVIDER=pyannote`, and set `PYANNOTE_AUTH_TOKEN`.
- Recording processing jobs use `RECORDING_JOB_TIMEOUT_SECONDS` because local transcription and diarization can exceed RQ's default 180 second timeout on CPU-only machines. Notes generation uses `NOTES_JOB_TIMEOUT_SECONDS`.

## Troubleshooting Focus

- API cannot connect to Postgres
- Worker cannot connect to Redis
- Browser cannot reach the API because `CORS_ALLOWED_ORIGINS` does not include the active web origin
- API or worker cannot authenticate to Cloudflare R2
- Worker cannot import `groq` or `faster-whisper`
- Recording fails with `Task exceeded maximum timeout value`: raise `RECORDING_JOB_TIMEOUT_SECONDS` and retry the failed recording
- Browser-facing API base URL and server-side internal API base URL diverge
