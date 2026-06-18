# Tasks

### [P2] Add read-only app settings surface

Expose server-global diarization status in the app shell without turning it into
a per-recording processing option.

Acceptance criteria:

- API returns `diarization_enabled` from non-secret server configuration
- shared client exposes a typed settings fetch
- desktop sidebar pins Settings at the bottom
- mobile navigation sheet exposes the same Settings popup
- `Enable Diarization` is read-only and mirrors backend configuration
- the dashboard upload page no longer shows a small `Dashboard` label above
  `New recording`
- focused API and web E2E coverage documents the behavior

- **Files**: `apps/api/salin_api/api/routes.py`, `apps/api/salin_api/schemas/settings.py`, `packages/shared/src/client.ts`, `apps/web/components/app-shell.tsx`, `apps/web/components/dashboard-upload-composer.tsx`, `apps/api/tests/test_recordings_api.py`, `apps/web/tests/e2e/upload.spec.ts`, `docs/ui.md`, `docs/testing.md`, `docs/tasks.md`
- **Context**: The app needs a small settings entry point before broader
  configuration work, while diarization remains a server-level deployment
  capability for now.
- **Status**: Done

### [P1] Harden deployed YouTube imports after bot-check recurrence

Make the production YouTube importer clearer and more recoverable when the
Droplet session is challenged again.

Acceptance criteria:

- worker settings accept an optional browser User-Agent for cookie-backed YouTube imports
- worker settings accept an optional PO-token provider URL
- production Compose includes the PO-token provider service for the worker
- the importer tries the PO-token provider strategy before existing Android and cookie fallbacks
- stale or rotated cookies fail with an actionable message instead of only raw `yt-dlp` output
- focused worker coverage documents the new strategies and failure message

- **Files**: `apps/api/salin_api/core/settings.py`, `apps/worker/salin_worker/services/youtube.py`, `apps/worker/salin_worker/services/processing.py`, `apps/worker/pyproject.toml`, `infra/docker-compose.prod.yml`, `.env.example`, `docs/setup.md`, `docs/architecture.md`, `docs/testing.md`, `docs/tasks.md`, `apps/worker/tests/test_youtube.py`
- **Context**: Fresh prod probes showed the current Droplet receives YouTube
  `LOGIN_REQUIRED` / bot-check responses for `ML3q7Ok4hJg`. The existing
  mounted cookies file is Netscape-formatted but yt-dlp reports that the
  YouTube account cookies are no longer valid, likely rotated in the browser.
- **Status**: Done

### [P2] Add recording delete from the library

Let users remove old or mistaken sessions from the library without changing the
upload dashboard or workspace flow.

Acceptance criteria:

- the library table exposes a compact delete action per recording row
- deletion requires confirmation before the API request is sent
- a successful delete removes the row from the library immediately
- the API deletes stored objects under `recordings/{id}/`
- the API deletes dependent transcript segment, notes, and processing job rows
  before deleting the recording row
- focused API and web E2E coverage lock the behavior in place

- **Files**: `apps/api/salin_api/api/routes.py`, `apps/api/salin_api/repositories/recordings.py`, `apps/api/salin_api/storage/r2.py`, `apps/web/app/library/page.tsx`, `apps/web/components/recordings-table.tsx`, `packages/shared/src/client.ts`, `docs/project-plan.md`, `docs/architecture.md`, `docs/testing.md`, `docs/ui.md`
- **Context**: Deletion was listed as a later file-management workflow, but the
  current library now needs a basic cleanup action before deeper UI polish.
- **Status**: Done

### [P1] Force the Android YouTube client for deployed imports

Keep public YouTube imports usable on the DigitalOcean Droplet when the default
YouTube player client still returns the bot-check wall even with a mounted
cookies file.

Acceptance criteria:

- the worker first tries the Android player API without cookies while skipping
  the initial webpage/config requests
- the worker falls back to a staged mounted cookie file only if the no-cookie
  strategy fails
- the importer does not force `bestaudio/best`, allowing `yt-dlp` to select the
  available Android-client format
- the importer validates duration before download without making a second
  extractor request
- focused worker coverage locks the extractor argument in place
- setup, architecture, and testing docs describe the Droplet recovery behavior

- **Files**: `apps/worker/salin_worker/services/youtube.py`, `apps/worker/tests/test_youtube.py`, `docs/setup.md`, `docs/testing.md`, `docs/architecture.md`, `docs/tasks.md`
- **Context**: On the Droplet, the same video failed with the default client and
  the staged cookies file, while the Android client succeeded against the same
  worker image, cookie file, and video URL. A second live check showed forcing
  `bestaudio/best` could still trigger the bot-check wall, while the default
  `yt-dlp` format choice selected a usable muxed format. The importer also
  previously made separate metadata and download extraction requests, doubling
  the chance of hitting a transient YouTube block. The most reliable Droplet
  probe used the Android player API with the initial webpage/config requests
  skipped and no cookie file attached.
- **Status**: Done

### [P1] Ship a JS challenge runtime for deployed YouTube imports

Make the production worker image include the upstream pieces that current
`yt-dlp` needs to solve YouTube's JS challenges after bot-check cookies are
mounted.

Acceptance criteria:

- the worker dependency set installs `yt-dlp[default]` so `yt-dlp-ejs` is available
- the worker image includes a supported JS runtime for `yt-dlp`
- the YouTube importer enables that runtime explicitly in its `yt-dlp` options
- focused worker coverage locks the runtime option in place
- setup and architecture docs describe the runtime requirement

- **Files**: `apps/worker/Dockerfile`, `apps/worker/pyproject.toml`, `apps/worker/salin_worker/services/youtube.py`, `apps/worker/tests/test_youtube.py`, `docs/setup.md`, `docs/testing.md`, `docs/architecture.md`, `docs/tasks.md`
- **Context**: On the Droplet, fresh cookies removed the bot-check error but
  `yt-dlp` still saw only storyboard formats because the worker image lacked a
  supported JS runtime and the companion EJS package required by current
  YouTube extraction.
- **Status**: Done

### [P1] Make mounted YouTube cookies files work from read-only secrets

Prevent deployed YouTube imports from failing when `yt-dlp` rewrites a cookies
jar that was mounted read-only into the worker container.

Acceptance criteria:

- the worker copies a configured `YOUTUBE_COOKIES_FILE` into a writable temp file
- `yt-dlp` receives the staged temp file instead of the read-only mount path
- focused worker coverage reproduces the read-only mounted-cookie case

- **Files**: `apps/worker/salin_worker/services/youtube.py`, `apps/worker/tests/test_youtube.py`, `docs/testing.md`, `docs/setup.md`, `docs/tasks.md`
- **Context**: The production worker mounts `deploy/secrets` read-only, but
  `yt-dlp` persists cookie updates on exit. Passing the mounted path directly
  causes a runtime failure even when the configured file exists.
- **Status**: Done

### [P1] Serve the production app and API through one domain

Put a production front door in front of the web and API services so
`salin.notsonata.dev` can serve the app and API through ports `80` and `443`
without browser calls to public `:8000`.

Acceptance criteria:

- production Compose includes a Caddy front door on ports `80` and `443`
- Caddy automatically issues and renews TLS for `salin.notsonata.dev`
- Next.js web is reachable behind the proxy
- FastAPI recording routes and docs are reachable behind the same domain
- browser-facing `NEXT_PUBLIC_API_BASE_URL` can be the domain root
- setup and architecture docs describe the same-origin production route

- **Files**: `infra/docker-compose.prod.yml`, `infra/Caddyfile.prod`, `docs/setup.md`, `docs/architecture.md`, `docs/tasks.md`
- **Context**: Cloudflare-proxied domains do not work well with a separate
  public browser API port, so the Droplet should serve web and API paths through
  one origin.
- **Status**: Done

### [P1] Make deployed YouTube imports recover from bot checks

Allow the worker to pass a mounted `cookies.txt` file to `yt-dlp` when public
YouTube imports return a bot-check challenge.

Acceptance criteria:

- worker settings expose an optional `YOUTUBE_COOKIES_FILE`
- YouTube importer passes the configured file to `yt-dlp`
- missing configured cookie files fail with an actionable error
- production Compose mounts a read-only secrets directory for the cookie file
- setup docs explain the DigitalOcean path and domain/API constraints
- focused worker coverage documents the cookie-file path

- **Files**: `apps/api/salin_api/core/settings.py`, `apps/worker/salin_worker/services/youtube.py`, `apps/worker/salin_worker/services/processing.py`, `infra/docker-compose.prod.yml`, `.env.example`, `docs/setup.md`, `docs/architecture.md`, `docs/testing.md`, `apps/worker/tests/test_youtube.py`
- **Context**: YouTube can return `Sign in to confirm you're not a bot` from
  `yt-dlp`; the server cannot use a local browser session, so deployment needs a
  mounted cookies file instead of hardcoded credentials.
- **Status**: Done

### [P2] Document the single-Droplet DigitalOcean deployment path

Document the current DigitalOcean deployment flow and make the checked-in
production Compose file match the way the browser reaches the API.

Acceptance criteria:

- `docs/setup.md` includes a step-by-step DigitalOcean Droplet guide
- The guide documents the current Caddy HTTPS front door and same-origin API routing
- `infra/docker-compose.prod.yml` publishes the API port required by the web app

- **Files**: `docs/setup.md`, `infra/docker-compose.prod.yml`, `docs/tasks.md`
- **Context**: The repo already targets a Docker Compose deployment on a
  DigitalOcean CPU Droplet, but the operational steps and API exposure were not
  explicit enough to run it from scratch.
- **Status**: Done

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
- Poll-based transcript workspace rendered at `/workspace/[id]`
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

Replace the current upload-only home screen and dead-end recording page with a
real dashboard plus a tabbed recording detail workflow.

Acceptance criteria:

- `/dashboard` becomes an upload-first dashboard with recent recordings history
- `/` becomes a dedicated product home that routes users into the dashboard
- `/workspace/[id]` gains obvious dashboard/library return navigation
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

### [P1] Keep macOS host-worker normalization non-interactive

Prevent the macOS host worker from hanging in `preprocessing` when `ffmpeg` runs under `rq.worker.SpawnWorker`.

Acceptance criteria:

- The worker's `ffmpeg` normalization path does not read from stdin
- macOS host-worker jobs no longer stop in `preprocessing` because `ffmpeg` is suspended by terminal input
- Worker regression coverage locks the non-interactive `ffmpeg` invocation in place

- **Files**: `apps/worker/salin_worker/services/audio.py`, `apps/worker/tests/test_audio.py`, `docs/testing.md`, `docs/tasks.md`
- **Context**: On macOS, the spawned RQ work-horse runs in its own process group, so an interactive `ffmpeg` subprocess can be stopped by the OS when it tries to read from stdin.
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

### [P2] Add public YouTube import for the presentation build

Let the dashboard accept a public single YouTube video URL as a demo-friendly
recording intake path without changing the downstream transcript, notes, speaker,
or export workflow.

Acceptance criteria:

- Dashboard exposes a clear choice between local file upload and YouTube URL import
- API validates YouTube-only URLs and stores a small import descriptor instead of blocking on download
- Worker downloads the audio with `yt-dlp`, stores it as the recording's original artifact, and continues through the existing normalization and transcription path
- Public single-video imports respect a configurable duration limit
- Playwright, API, and worker coverage document the importer boundary

- **Files**: `apps/web/components/dashboard-upload-composer.tsx`, `apps/api/salin_api/api/routes.py`, `apps/worker/salin_worker/services/processing.py`, `apps/worker/salin_worker/services/youtube.py`, `packages/shared/src/client.ts`, `docs/setup.md`, `docs/testing.md`, `docs/architecture.md`, `docs/ui.md`
- **Context**: The professor demo may use web-hosted public recordings. This remains an importer for saved recordings, not live meeting capture or realtime transcription.
- **Status**: Done

### [P2] Revamp the Salin web UI around the Study Desk direction

Polish the existing dashboard and recording detail workspace into a premium,
transcript-first review experience using the Salin Study Desk design system,
Trint-style transcript workflow references, and Linear-style light-mode control
polish.

Acceptance criteria:

- dashboard keeps upload as the first-priority action and recent recordings as a compact working table
- home and dashboard are separate so onboarding copy does not compete with the upload form
- recording detail keeps transcript review visually primary
- notes remain immediately discoverable without competing with transcript reading
- export actions are grouped into a polished menu or toolbar surface
- processing, fallback, diarization, and notes failure states stay clear and non-blocking
- lucide icon controls use dark ink, muted, active teal, disabled, hover, and focus states consistently
- desktop and mobile layouts are verified for spacing, text fit, and control overlap
- existing upload, transcript, notes, speaker correction, and export E2E flows still pass

- **Files**: `apps/web`, `docs/ui.md`, `docs/superpowers/plans/2026-06-16-ui-ux-revamp.md`
- **Context**: The core product flows are implemented, so the next front-end pass should make the workspace feel complete without changing product scope.
- **Plan**: `docs/superpowers/plans/2026-06-16-ui-ux-revamp.md`
- **Status**: Done

### [P2] Reset the Salin UI into a light-first transcript console

Replace the old warm-neutral Study Desk presentation with a lighter transcript
review system using the Newsroom Console + Bilingual Review Board hybrid, with
the home page as the brand entry and the dashboard / workspace as restrained
task surfaces.

Acceptance criteria:

- light mode becomes the default visual mode for this pass
- `DESIGN.md` is replaced with the transcript-console design direction
- home uses one committed transcript-specimen composition instead of a generic feature grid
- home and dashboard share a left-rail app shell
- dashboard keeps upload first but behaves like a compact command deck
- desktop recording detail becomes a transcript-first split workspace with a notes dock
- mobile recording detail falls back to transcript and notes tabs
- transcript and notes exports stay grouped into compact menus
- updated E2E coverage reflects the new home, desktop, and mobile structure

- **Files**: `apps/web`, `DESIGN.md`, `docs/ui.md`, `docs/testing.md`
- **Context**: The prior UI refresh still read like a generic vibecoded app, especially on the home page and workspace shell.
- **Status**: Done

### [P2] Refine transcript workspace editing and playback

Improve the editing ergonomics and playback behavior of the transcript workspace based on user feedback.

Acceptance criteria:

- Audio playback pauses automatically at the end of a clicked segment instead of continuing indefinitely
- Overlapping playback from rapid segment clicks is prevented
- Unnecessary "estimated", "edited", and "groq" provider chips are removed from transcript segments
- The per-segment edit form stacks fields vertically and uses a Textarea for the segment text
- The recording session name can be renamed inline from the workspace header
- The renaming capability is supported by a backend PUT endpoint and client types

- **Files**: `apps/web/components/transcript-player.tsx`, `apps/web/components/transcript-panel.tsx`, `apps/web/components/recording-workspace.tsx`, `apps/web/components/recording-detail-header.tsx`, `apps/api/salin_api/api/routes.py`, `apps/api/salin_api/repositories/recordings.py`, `packages/shared/src/client.ts`
- **Context**: Real usage revealed that the segment edit form was too cramped, the provider chips were noisy, playback needed segment-level pausing, and users needed a way to rename recordings.
- **Status**: Done
