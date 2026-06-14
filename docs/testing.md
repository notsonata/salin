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
- `GET /recordings` returns recent dashboard rows
- Recording detail synthesizes idle notes state before the first notes run
- Speaker rename updates matching transcript segments and marks them edited
- Per-block speaker reassignment updates only the selected transcript segment
- Manual notes queueing enforces transcript-complete and no-duplicate-in-flight rules
- `PUT /recordings/{id}/notes` persists structured edits and refreshes dashboard recency

### Worker integration

`apps/worker/tests/test_processing.py`

- Canonical transcript segments persist from the Groq path
- Groq failure falls back to `faster-whisper` without changing the stored segment shape
- Configured diarization results align estimated speaker labels before transcript persistence
- Diarization failure keeps generic speaker labels and does not fail completed transcription
- Notes generation persists structured sections from stored transcript data
- Notes failures keep transcript data intact
- Notes regeneration replaces content only after a successful rerun

`apps/worker/tests/test_diarization.py`

- Transcript segments receive the estimated speaker label with the largest diarization overlap
- Transcript segments stay unchanged when no diarization span overlaps them

`apps/worker/tests/test_pyannote_provider.py`

- pyannote annotation output normalizes into Salin diarization segments
- known speaker count is forwarded as `num_speakers`
- Apple Silicon host runtimes prefer `mps` when `PYANNOTE_DEVICE=auto`, and explicit unavailable `mps` requests fail clearly
- pyannote task wiring stays disabled until provider and token settings are present

`apps/worker/tests/test_run_sh.py`

- `run.sh` starts Docker without the worker and launches a host worker on macOS
- `run.sh` uses `rq.worker.SpawnWorker` for the macOS host-worker path
- `run.sh` falls back to the repo-local tooling `rq` script when `uv` is unavailable on macOS
- `run.sh` bootstraps repo-local worker dependencies for the tooling fallback when pyannote diarization is enabled
- `run.sh` keeps the full Docker stack on non-macOS hosts

`apps/worker/tests/test_audio.py`

- The worker normalizer runs `ffmpeg` with `-nostdin` and `stdin=subprocess.DEVNULL` so macOS host-worker jobs cannot be suspended by terminal input

### Web E2E

`apps/web/tests/e2e/upload.spec.ts`

- Dashboard renders upload-first hierarchy plus recent recordings history
- Supported upload redirects into the transcript workspace, renders normalized playback, supports transcript search, and exports transcript TXT
- Speaker labels can be renamed and reassigned from the transcript workspace
- Manual notes generation renders completed structured notes
- Structured notes edits save successfully from the notes tab
- Notes failure keeps transcript review available and allows regeneration
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

Playwright defaults to port `3100` so browser E2E does not collide with the Dockerized local stack on `3000`.
If local browser automation cannot bind a port in the current environment, fall back to web typecheck plus `pnpm --filter @salin/web build` and note the skipped E2E run explicitly.

Container smoke:

```bash
docker compose -f infra/docker-compose.yml build
```

## What To Prefer

- Prefer provider fakes for Groq, R2, and `faster-whisper` boundaries in routine test runs.
- Prefer one focused E2E happy path and one meaningful failure path for the web flow.
- Do not add UI tests for static markup that is already exercised by E2E behavior.

## Known Limits

- Real provider-backed end-to-end validation still depends on live Groq, OpenRouter, R2, and Redis/Postgres availability.
- Live pyannote-backed diarization validation depends on Hugging Face model access and `PYANNOTE_AUTH_TOKEN`; routine tests use fakes and do not download the gated model.
- Notes TXT export, PDF export, and combined export do not exist yet, so they should not appear in current test expectations.
- Chunking is intentionally absent in the current slice, so large-file behavior is currently a bounded failure path rather than a success path.
