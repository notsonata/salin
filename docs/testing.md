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
- YouTube import persists a descriptor, validates the URL boundary, and enqueues the normal recording job
- `GET /recordings` returns recent dashboard rows
- Recording detail synthesizes idle notes state before the first notes run
- Speaker rename updates matching transcript segments and marks them edited
- Per-block speaker reassignment updates only the selected transcript segment
- Manual notes queueing enforces transcript availability and no-duplicate-in-flight rules
- Notes can be queued while the recording is in the `diarizing` stage when transcript segments already exist
- `PUT /recordings/{id}/notes` persists structured edits and refreshes dashboard recency
- Transcript TXT/PDF, notes TXT/PDF, and combined TXT/PDF exports are generated from stored rows
- Export requests do not enqueue background transcription or notes work

### Worker integration

`apps/worker/tests/test_processing.py`

- Canonical transcript segments persist from the Groq path
- Groq failure falls back to `faster-whisper`, exposes a non-fatal fallback note, and keeps the stored segment shape
- Transcript segments persist before configured diarization begins
- Configured diarization results replace generic estimated speaker labels after transcript persistence
- Diarization failure keeps generic speaker labels, stores a non-fatal note, and does not fail completed transcription
- Long recordings split into overlapped chunks, report chunk progress, and merge timestamps back into recording-relative transcript segments
- Cached chunk artifacts are reused on retry so completed chunks are not transcribed again
- YouTube import descriptors are downloaded into audio artifacts before normal transcription
- YouTube import passes a configured `cookies.txt` file to `yt-dlp` and fails clearly when that configured file is missing
- Notes generation persists Markdown notes content from stored transcript data
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

- Home page frames Salin as a review board and routes into the dashboard and preview workspace
- Dashboard renders the recording intake command deck with file upload and YouTube URL options
- Supported upload redirects into the split transcript workspace, renders normalized playback, keeps the transcript toolbar sticky, supports transcript search, and exposes grouped transcript export links
- YouTube URL import redirects into the same transcript workspace path
- Desktop renders the transcript column and notes dock together while mobile falls back to transcript/notes tabs
- Transcript content remains visible while speaker labels are still being estimated
- Speaker labels can be renamed globally and reassigned per row from the transcript workspace
- Manual notes generation renders completed Markdown notes and exposes grouped notes/combined export links
- Structured notes edits save successfully from the notes dock
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
- Real long-recording validation still depends on live provider limits, R2 availability, and worker timeout settings; routine coverage uses deterministic provider and chunking fakes.
