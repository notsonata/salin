# Testing Strategy

## Validation Ladder

Use the lowest level that gives credible confidence:

1. Static checks
2. Integration tests around upload, storage, job state, and worker processing
3. E2E tests for the user-visible upload and transcript flow
4. Docker build checks when container or orchestration behavior changes

## Current Coverage

### API integration

`apps/api/tests/test_recordings_api.py`

- Recording routes return CORS headers for the configured browser origin
- Supported upload persists metadata and enqueues a job
- Unsupported file type returns the expected validation error

### Worker integration

`apps/worker/tests/test_processing.py`

- Canonical transcript segments persist from the Groq path
- Groq failure falls back to `faster-whisper` without changing the stored segment shape

### Web E2E

`apps/web/tests/e2e/upload.spec.ts`

- Supported upload redirects into the transcript workspace and renders completed transcript content
- Unsupported upload surfaces the API error in the form

The current web E2E uses API interception so the frontend flow can be tested without live provider calls.

## Commands

Zero-dependency Python syntax smoke:

```bash
python3 -m compileall apps/api apps/worker
```

Python lint and tests:

```bash
uv run --package salin-api ruff check apps/api
uv run --package salin-worker ruff check apps/worker
uv run --package salin-api pytest apps/api/tests
uv run --package salin-worker pytest apps/worker/tests
```

Web checks:

```bash
pnpm --filter @salin/shared typecheck
pnpm --filter @salin/web typecheck
pnpm --filter @salin/web lint
pnpm --filter @salin/web test:e2e
pnpm --filter @salin/web build
```

Container smoke:

```bash
docker compose -f infra/docker-compose.yml build
```

## What To Prefer

- Prefer provider fakes for Groq, R2, and `faster-whisper` boundaries in routine test runs.
- Prefer one focused E2E happy path and one meaningful failure path for the web flow.
- Do not add UI tests for static markup that is already exercised by E2E behavior.

## Known Limits

- Real provider-backed end-to-end validation still depends on live Groq, R2, and Redis/Postgres availability.
- Diarization, notes generation, export, search, and timestamp seeking do not exist yet, so they should not appear in current test expectations.
- Chunking is intentionally absent in phase 1, so large-file behavior is currently a bounded failure path rather than a success path.
