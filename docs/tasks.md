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
- **Status**: Active

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
- **Status**: Blocked

### [P2] Add export outputs for transcript and notes

Support TXT and PDF output without requiring full reprocessing.

Acceptance criteria:

- Export transcript as TXT
- Export notes as TXT
- Export transcript and notes together as PDF
- Export retry can run independently of transcription

- **Files**: `apps/api`, `apps/worker`, `apps/web`, `packages/shared`
- **Context**: Export matters to user workflow, but it is downstream of transcript and notes correctness.
- **Status**: Blocked
