# Tasks

### [P0] Allow browser-to-API requests in local development

Fix the local cross-origin boundary between the Next.js web app on `localhost:3000`
and the FastAPI service on `localhost:8000`.

Acceptance criteria:

- API responses include the configured CORS headers for the active web origin
- Local Docker Compose defaults keep browser fetches working without manual code edits
- The API test coverage documents the regression

- **Files**: `apps/api`, `.env.example`, `docs/setup.md`, `docs/testing.md`
- **Context**: The transcript workspace depends on browser-side fetches to the API, so missing CORS blocks upload completion and transcript polling even when the backend is healthy.
- **Status**: Done

### [P0] Deliver the transcript-only vertical slice

Build the first end-to-end usable flow: upload one supported recording, process it asynchronously, persist canonical transcript blocks, and render a completed transcript page.

Acceptance criteria:

- Supported audio or video upload from the web UI
- Original upload persisted to Cloudflare R2
- `Recording` and `ProcessingJob` metadata persisted to Postgres
- Background preprocessing and Groq-first transcription with `faster-whisper` fallback
- Canonical transcript segments persisted regardless of provider path
- Poll-based transcript workspace rendered at `/recordings/[id]`
- One focused happy-path web E2E and one unsupported-file failure path

- **Files**: `apps/web`, `apps/api`, `apps/worker`, `packages/shared`, `infra`, `docs/testing.md`, `docs/setup.md`, `docs/architecture.md`, `docs/ui.md`
- **Context**: This proves the product’s transcript spine before diarization, notes, and export work.
- **Status**: Done

### [P0] Verify the scaffolded local stack with installed dependencies

Confirm that the checked-in scaffold runs with the intended toolchain and local orchestration.

Acceptance criteria:

- `pnpm` and `uv` are installed locally
- Python tests and lint run through `uv`
- Web typecheck, lint, and Playwright run through `pnpm`
- `docker compose -f infra/docker-compose.yml build` succeeds

- **Files**: `infra`, `apps/web`, `apps/api`, `apps/worker`, `package.json`, `pyproject.toml`
- **Context**: The repo now contains the real scaffold, but dependency-backed verification must be kept explicit.
- **Status**: Done

### [P0] Rebuild the web app into an upload-first dashboard and recording detail workspace

Replace the current upload-only home screen and dead-end recording page with a real dashboard plus a tabbed recording detail workflow.

Acceptance criteria:

- `/` becomes an upload-first dashboard with recent recordings history
- `/recordings/[id]` gains obvious dashboard return navigation
- recording detail splits into `Transcript` and `Notes` tabs
- notes become editable and savable in their structured section form
- API and shared client support recordings listing and notes updates
- focused API and web E2E coverage document the new workflow

- **Files**: `apps/web`, `apps/api`, `packages/shared`, `docs/ui.md`, `docs/testing.md`, `docs/architecture.md`, `docs/tasks.md`
- **Context**: The current flow feels like a disconnected demo. The product needs a durable home, repeat-use navigation, and a usable notes workflow.
- **Status**: Done

### [P1] Build the interactive transcript workspace

Extend the transcript view into a real review workspace.

Acceptance criteria:

- Audio player loads the recording
- Clicking a transcript timestamp seeks playback correctly
- Transcript text is searchable
- Transcript blocks show timestamp, speaker label, and text clearly
- Processing and failure states remain understandable in the UI

- **Files**: `apps/web`, `packages/shared`, `docs/ui.md`, `docs/testing.md`
- **Context**: Reviewability is the reason the transcript is useful.
- **Status**: Done

### [P1] Generate structured notes from stored transcript data

Produce summary, key points, decisions, action items, and questions from saved transcript data rather than raw audio.

Acceptance criteria:

- Notes generation runs against stored transcript content
- Notes are stored separately from transcript blocks
- Failed notes generation keeps the transcript available
- Users can regenerate notes without rerunning transcription

- **Files**: `apps/api`, `apps/worker`, `apps/web`, `packages/shared`, `docs/architecture.md`
- **Context**: Notes are a major user-facing value layer, but must stay downstream of transcript persistence.
- **Status**: Done

### [P1] Add estimated speaker diarization and correction workflows

Attach estimated speaker labels to transcript blocks and let users fix them.

Acceptance criteria:

- Diarization runs with auto or user-provided speaker count
- Transcript segments align to diarization results
- Speaker labels are visibly marked as estimated
- Users can rename speakers and reassign a block speaker
- Duplicate speaker labels can be merged

- **Files**: `apps/worker`, `apps/api`, `apps/web`, `packages/shared`, `docs/ui.md`, `docs/testing.md`
- **Context**: Speaker separation improves usability, but operational complexity means it should land after the transcript spine is stable.
- **Provider**: `pyannote.audio` through `pyannote/speaker-diarization-community-1` when `DIARIZATION_PROVIDER=pyannote` and `PYANNOTE_AUTH_TOKEN` are configured.
- **Status**: Done

### [P1] Add Apple Silicon host support for pyannote diarization

Enable `mps` device selection for host-run diarization on Apple Silicon Macs, and make the Docker Compose limitation explicit.

Acceptance criteria:

- `PYANNOTE_DEVICE=auto` prefers `mps` when CUDA is unavailable and the host runtime exposes Apple's Metal backend
- Explicit `PYANNOTE_DEVICE=mps` fails clearly when the runtime does not expose `mps`
- Setup docs explain that Docker Compose on macOS remains CPU-only for pyannote diarization
- Worker provider tests cover the Apple Silicon device-selection path

- **Files**: `apps/worker`, `.env.example`, `docs/setup.md`, `docs/testing.md`, `docs/tasks.md`
- **Context**: The current local stack runs the worker in a Linux container on macOS, so Apple GPU acceleration is unavailable unless the worker runs directly on the host.
- **Status**: Done

### [P1] Run the worker directly on macOS through `run.sh`

Make the default repo startup path use a host-run worker on macOS while keeping the existing Docker-only path on other platforms.

Acceptance criteria:

- On macOS, `./run.sh` starts `web`, `api`, `postgres`, and `redis` in Docker and runs the worker directly on the host
- The macOS host-worker path avoids RQ's default `fork()` work-horse behavior
- The host-run worker receives `localhost`-safe Postgres and Redis URLs instead of Compose-only service hostnames
- On non-macOS hosts, `./run.sh` still starts the full Docker Compose stack
- Script-level regression coverage documents both branches

- **Files**: `run.sh`, `docs/setup.md`, `docs/testing.md`, `docs/tasks.md`, `README.md`, `apps/worker/tests/test_run_sh.py`
- **Context**: Apple GPU support for diarization requires the worker to run on the macOS host, but the rest of the stack can stay containerized.
- **Status**: Done

### [P1] Make macOS `run.sh` resilient when `uv` is not on `PATH`

Prevent the default macOS startup path from failing at host worker launch when `uv` is not installed globally.

Acceptance criteria:

- `./run.sh` on macOS still launches the host worker when `uv` is available
- `./run.sh` falls back to `python3 -m uv` when that path exists
- `./run.sh` falls back to the repo-local `.venv-tooling/bin/rq` when neither `uv` path is available
- The macOS host-worker path uses `rq.worker.SpawnWorker` instead of the default forking worker
- The repo-local fallback bootstraps worker dependencies when pyannote diarization is enabled and `pyannote.audio` is missing
- The failure message stays actionable if no supported host worker runner exists
- Script-level regression coverage documents the fallback path

- **Files**: `run.sh`, `apps/worker/tests/test_run_sh.py`, `docs/setup.md`, `docs/testing.md`, `README.md`, `docs/tasks.md`
- **Context**: The host-worker macOS path is required for Apple diarization acceleration, so the startup script cannot assume a globally installed `uv` binary.
- **Status**: Done

### [P1] Make transcript readiness independent from diarization

Keep transcript review available as soon as transcription succeeds, even when speaker estimation is still running or fails.

Acceptance criteria:

- Transcript segments persist before diarization starts
- The worker moves into a visible `diarizing` stage after transcript persistence
- Groq fallback to local transcription is recorded as a non-fatal processing note
- Diarization failure keeps the transcript completed with generic estimated speaker labels
- The web workspace renders transcript content during `diarizing`
- Notes generation can be requested once transcript segments exist

- **Files**: `apps/worker`, `apps/api`, `apps/web`, `packages/shared`, `docs/architecture.md`, `docs/testing.md`, `docs/ui.md`
- **Context**: Long recordings must not look frozen just because speaker estimation is slow. Transcript review is the primary value and should not wait for diarization.
- **Status**: Done

### [P1] Add chunked long-recording transcription

Split long normalized audio into retryable transcription chunks and merge them back into the canonical transcript contract.

Acceptance criteria:

- Long recordings are split into provider-safe chunks with small overlap
- Chunk transcript timestamps merge back into recording-relative timestamps
- Failed chunks can be retried without restarting completed chunks
- Progress can report chunk counts such as `Transcribing chunk 3/12`
- Chunking uses the Groq-first path and keeps local fallback behind the same contract

- **Files**: `apps/worker`, `apps/api`, `apps/web`, `packages/shared`, `docs/architecture.md`, `docs/testing.md`
- **Context**: Podcast-length uploads need chunking to avoid huge all-or-nothing jobs and to support useful progress.
- **Status**: Done

### [P1] Add macOS host-only presentation runner

Run Salin locally on an Apple Silicon Mac without Docker so diarization can use
host hardware backends and presentation setup stays lighter.

Acceptance criteria:

- `run-local.sh` starts the API, worker, and web app on the host
- The script expects local Postgres and Redis on `localhost`
- Compose-style `postgres` and `redis` hosts from `.env` are rewritten to `localhost`
- The worker uses RQ's spawn worker class for macOS safety
- Setup docs include Homebrew service and local database instructions

- **Files**: `run-local.sh`, `docs/setup.md`, `README.md`
- **Context**: The M4 presentation machine should not need Docker for the live demo path.
- **Status**: Done

### [P2] Add export outputs for transcript and notes

Support TXT and PDF output without requiring full reprocessing.

Acceptance criteria:

- Export transcript as TXT
- Export notes as TXT
- Export transcript and notes together as PDF
- Export retry can run independently of transcription

- **Files**: `apps/api`, `apps/worker`, `apps/web`, `packages/shared`
- **Context**: Export matters to user workflow, but it is downstream of transcript and notes correctness.
- **Backend status**: Transcript TXT/PDF, notes TXT/PDF, and combined TXT/PDF endpoints are implemented.
- **Web status**: Current-style transcript, notes, and combined export controls are implemented in the recording workspace.
- **Deferred**: Export presentation polish belongs with the later UI revamp.
- **Status**: Done
