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
- `TRANSCRIPTION_CHUNK_MINUTES`
- `TRANSCRIPTION_CHUNK_OVERLAP_SECONDS`
- `RECORDING_JOB_TIMEOUT_SECONDS`
- `NOTES_JOB_TIMEOUT_SECONDS`
- `YOUTUBE_IMPORT_MAX_MINUTES`
- `MAX_UPLOAD_MB`
- `NEXT_PUBLIC_API_BASE_URL`
- `SALIN_API_INTERNAL_BASE_URL`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODELS`

Optional diarization values:

- `DIARIZATION_PROVIDER`: use `none` or `pyannote`
- `PYANNOTE_AUTH_TOKEN`: required only when `DIARIZATION_PROVIDER=pyannote`
- `PYANNOTE_MODEL`: defaults to `pyannote/speaker-diarization-community-1`
- `PYANNOTE_DEVICE`: use `auto`, `cpu`, `cuda`, or `mps`
- `PYANNOTE_METRICS_ENABLED`: defaults to `0` in the template

Optional YouTube import value:

- `YOUTUBE_COOKIES_FILE`: path to a Netscape-format `cookies.txt` file for
  `yt-dlp` when YouTube asks the server to confirm it is not a bot.
  The worker stages this file into a writable temp path before invoking
  `yt-dlp`, so the mounted source file can remain read-only.

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

Default repo startup script:

```bash
./run.sh
```

Mac host-only presentation path:

```bash
sh ./run-local.sh
```

This path does not start Docker. It expects local Postgres and Redis to already be
running on `localhost`, starts the API on `localhost:8000`, starts the worker on
the host with RQ's spawn worker class, and starts the web app on
`localhost:3000`. It rewrites Compose-style `postgres` and `redis` hosts from
`.env` to `localhost` for the running process.

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

## macOS Host Setup

Install the local services:

```bash
brew install postgresql@16 redis ffmpeg uv
corepack enable
corepack prepare pnpm@9.15.4 --activate
```

Start local Postgres and Redis:

```bash
brew services start postgresql@16
brew services start redis
```

Create the local database and role once:

```bash
createuser salin
createdb -O salin salin
psql -d postgres -c "ALTER USER salin WITH PASSWORD 'salin';"
```

For host-only macOS runs, these values are expected after `run-local.sh` rewrites
Compose service names to `localhost`:

```bash
DATABASE_URL=postgresql+psycopg://salin:salin@localhost:5432/salin
REDIS_URL=redis://localhost:6379/0
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
SALIN_API_INTERNAL_BASE_URL=http://localhost:8000
PYANNOTE_DEVICE=auto
```

## DigitalOcean Deployment

This repository currently includes a single-Droplet Docker Compose deployment
path through `infra/docker-compose.prod.yml`.

Important current constraints:

- The production compose file uses a Caddy front door on ports `80` and `443`.
  Browser requests to `/recordings`, `/docs`, `/redoc`, and `/openapi.json` are
  routed to FastAPI; all other paths are routed to the Next.js web app.
- Caddy requests and renews the TLS certificate for `salin.notsonata.dev`
  automatically. Keep the DNS record pointed directly at the Droplet while Caddy
  is issuing the certificate.
- Postgres data stays on the Droplet in the `postgres-data` Docker volume. R2
  stores uploaded artifacts, but it does not replace your database backups.

### 1. Create the Droplet

In the DigitalOcean control panel, create a Droplet with:

- Ubuntu 24.04 LTS
- A region near your users
- An SSH key, not a password
- Monitoring and backups if you want easier operations

Repo-specific sizing guidance:

- A small shared-CPU Droplet is enough for basic demo traffic when
  `DIARIZATION_PROVIDER=none`.
- If you want to run `pyannote` diarization on the same host, use a larger CPU
  Droplet. That is a Salin workload recommendation, not a DigitalOcean rule.

### 2. Add a Cloud Firewall

Attach a firewall to the Droplet with these inbound rules:

- `SSH` from your IP
- `HTTP` on port `80` from `0.0.0.0/0` and `::/0`
- `HTTPS` on port `443` from `0.0.0.0/0` and `::/0`

### 3. Connect to the server

```bash
ssh root@<droplet-ip>
```

### 4. Install Docker Engine, Compose, and Git

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl status docker
sudo docker run hello-world
```

If you want to run `docker` without `sudo`, follow Docker's post-install steps
to add your user to the `docker` group.

### 5. Clone the repository

```bash
git clone <your-repo-url> salin
cd salin
```

### 6. Create the production `.env`

```bash
cp .env.example .env
```

Edit `.env` and set the required secrets plus these deployment-specific values:

```env
APP_ENV=production
DATABASE_URL=postgresql+psycopg://salin:salin@postgres:5432/salin
REDIS_URL=redis://redis:6379/0
CORS_ALLOWED_ORIGINS=http://<droplet-ip>,http://salin.notsonata.dev
NEXT_PUBLIC_API_BASE_URL=
SALIN_API_INTERNAL_BASE_URL=http://api:8000
DIARIZATION_PROVIDER=none
# Optional, but recommended if YouTube imports hit bot checks:
YOUTUBE_COOKIES_FILE=/run/secrets/salin/youtube-cookies.txt
```

Then fill in the real provider values for:

- `R2_BUCKET_NAME`
- `R2_ENDPOINT_URL`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_REGION`
- `GROQ_API_KEY`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODELS`

Notes:

- For `salin.notsonata.dev`, point the DNS `A` record at the Droplet public IP
  `157.230.245.202`. The app no longer needs public `:8000` access because Caddy
  routes API paths behind the same origin on ports `80` and `443`.
- Leave `NEXT_PUBLIC_API_BASE_URL` empty in production so uploads, polling, and
  exports use same-origin relative paths such as `/recordings`.
- Start with `DIARIZATION_PROVIDER=none` unless you have the CPU budget and a
  working `PYANNOTE_AUTH_TOKEN`.

For YouTube videos that return a bot-check error from `yt-dlp`, export browser
cookies in Netscape `cookies.txt` format and place the file on the Droplet at:

```bash
/opt/salin/deploy/secrets/youtube-cookies.txt
```

Keep this file out of git. The production Compose file mounts
`deploy/secrets` read-only into the worker container at `/run/secrets/salin`.

### 7. Start the stack

```bash
docker compose -f infra/docker-compose.prod.yml up --build -d
```

The first build can take a while because the web image installs its Node
dependencies and Playwright browser runtime during image build.

### 8. Verify the deployment

Check container state:

```bash
docker compose -f infra/docker-compose.prod.yml ps
```

Tail logs if needed:

```bash
docker compose -f infra/docker-compose.prod.yml logs -f api
docker compose -f infra/docker-compose.prod.yml logs -f worker
docker compose -f infra/docker-compose.prod.yml logs -f web
```

Then verify from your local machine:

- Open `http://<droplet-ip>` for the web app
- Open `https://salin.notsonata.dev` for the web app after the DNS `A` record
  points at the Droplet and Caddy finishes certificate issuance
- Open `https://salin.notsonata.dev/docs` for FastAPI docs through Caddy
- Upload a small supported recording and confirm the worker moves it through
  `uploaded -> preprocessing -> transcribing -> completed`

### 9. Update the deployment

```bash
git pull
docker compose -f infra/docker-compose.prod.yml up --build -d
```

### 10. Stop or restart the stack

```bash
docker compose -f infra/docker-compose.prod.yml down
docker compose -f infra/docker-compose.prod.yml restart
```

### 11. Recommended next hardening steps

- Keep Droplet firewall rules limited to `22`, `80`, and `443` once the demo API
  no longer needs direct debug access
- Add Droplet backups and restore practice for Postgres
- Consider moving Postgres off the Droplet before treating this as a durable
  production environment

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

- The worker image includes `ffmpeg`, a Deno runtime, and the `yt-dlp`
  default extras needed for current YouTube JS challenge solving. The YouTube
  importer also forces the Android YouTube player client because the default
  client can still hit bot checks on the DigitalOcean Droplet. It does not
  force an audio-only format selector because current Android-client responses
  can expose only a muxed MP4 format that `ffmpeg` can still normalize.
- The web app uses `NEXT_PUBLIC_API_BASE_URL` in the browser and `SALIN_API_INTERNAL_BASE_URL` for server-side paths.
- `CORS_ALLOWED_ORIGINS` must include the browser-facing web origin, which is `http://localhost:3000` for the default Docker Compose setup.
- Cloudflare R2 remains the source of truth for original, normalized, and raw-provider artifacts.
- The phase 1 worker supports Groq-first transcription with `faster-whisper` fallback.
- The presentation YouTube importer uses the worker's `yt-dlp` dependency to download audio from public single-video links, then continues through the normal recording pipeline.
- `YOUTUBE_IMPORT_MAX_MINUTES` limits public YouTube imports before transcription starts. The default is 180 minutes.
- `YOUTUBE_COOKIES_FILE` lets the worker pass an exported browser
  `cookies.txt` file to `yt-dlp` for public videos that trigger YouTube's bot
  check.
- Long recordings are split into overlapped transcription chunks. The default chunk size is controlled by `TRANSCRIPTION_CHUNK_MINUTES`, and overlap is controlled by `TRANSCRIPTION_CHUNK_OVERLAP_SECONDS`.
- Completed transcription chunks are cached as R2 artifacts, so retrying a failed job can resume from the first missing chunk instead of retranscribing completed chunks.
- Diarization is disabled by default. To enable pyannote-backed diarization, accept the selected model's Hugging Face conditions, create a token, set `DIARIZATION_PROVIDER=pyannote`, and set `PYANNOTE_AUTH_TOKEN`.
- `PYANNOTE_DEVICE=auto` prefers `cuda`, then `mps`, then `cpu`.
- On Apple Silicon Macs, `mps` support only applies when the worker runs directly on the macOS host. The Docker Compose worker runs in a Linux container and cannot use Apple's `mps` backend, so diarization remains CPU-only there.
- If you want Apple GPU acceleration for diarization on macOS, run the worker directly from the host toolchain and leave `PYANNOTE_DEVICE=auto` or set `PYANNOTE_DEVICE=mps`.
- For a fully host-only macOS presentation run, use `sh ./run-local.sh`. This leaves Docker out of the loop entirely and uses local Postgres and Redis.
- On macOS, `./run.sh` now automates that split mode: it starts `web`, `api`, `postgres`, and `redis` in Docker, then runs the worker directly on the host with `localhost` overrides for Postgres and Redis.
- The macOS host-worker path uses RQ's `rq.worker.SpawnWorker` to avoid `fork()`-based work-horse crashes from Objective-C backed libraries.
- For the macOS host worker, `./run.sh` prefers `uv`, then `python3 -m uv`, and finally falls back to the repo-local `.venv-tooling/bin/rq` script if present.
- If `DIARIZATION_PROVIDER=pyannote` and that repo-local fallback environment does not yet have `pyannote.audio`, `./run.sh` bootstraps `apps/api` and `apps/worker` into `.venv-tooling` before starting the host worker.
- On non-macOS hosts, `./run.sh` still starts the full Docker Compose stack, including the worker container.
- On macOS, `./run.sh` is now a fixed default startup path. For custom Docker Compose arguments or service selection, use `docker compose` directly.
- Recording processing jobs use `RECORDING_JOB_TIMEOUT_SECONDS` because local transcription and diarization can exceed RQ's default 180 second timeout on CPU-only machines. Notes generation uses `NOTES_JOB_TIMEOUT_SECONDS`.

## Troubleshooting Focus

- API cannot connect to Postgres
- Worker cannot connect to Redis
- Browser cannot reach the API because `CORS_ALLOWED_ORIGINS` does not include the active web origin
- API or worker cannot authenticate to Cloudflare R2
- Worker cannot import `groq` or `faster-whisper`
- Worker cannot import `yt-dlp`: rerun `uv sync --all-packages --dev` before using YouTube import
- YouTube import fails before transcription: confirm the link is a public single video, not a playlist, private video, age-gated video, or livestream
- YouTube import fails with `Sign in to confirm you're not a bot`: export a
  fresh Netscape-format `cookies.txt`, place it at
  `deploy/secrets/youtube-cookies.txt` on the host, set
  `YOUTUBE_COOKIES_FILE=/run/secrets/salin/youtube-cookies.txt`, and restart the
  worker.
- YouTube import fails with `n challenge solving failed` or only storyboard
  formats: rebuild and restart the worker so the image includes the checked-in
  Deno runtime, `yt-dlp[default]` dependency set, and Android player-client
  importer option. The importer should also leave format selection to `yt-dlp`
  instead of forcing `bestaudio/best`.
- Recording fails with `Task exceeded maximum timeout value`: raise `RECORDING_JOB_TIMEOUT_SECONDS` and retry the failed recording
- Long recording appears stuck: check the job note for chunk progress such as `Transcribing chunk 3/12`, and confirm the worker is still running
- Browser-facing API base URL and server-side internal API base URL diverge
