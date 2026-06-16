#!/usr/bin/env sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

require_command() {
  command_name=$1
  install_hint=$2
  if ! command -v "$command_name" >/dev/null 2>&1; then
    printf 'Missing required command: %s\n%s\n' "$command_name" "$install_hint" >&2
    exit 1
  fi
}

tcp_available() {
  host=$1
  port=$2
  python3 -c "import socket; socket.create_connection(('''$host''', $port), timeout=1).close()" \
    >/dev/null 2>&1
}

require_tcp_port() {
  host=$1
  port=$2
  label=$3
  hint=$4
  if ! tcp_available "$host" "$port"; then
    printf '%s is not reachable on %s:%s.\n%s\n' "$label" "$host" "$port" "$hint" >&2
    exit 1
  fi
}

wait_for_tcp_port() {
  host=$1
  port=$2
  label=$3
  attempts=${4:-60}

  while [ "$attempts" -gt 0 ]; do
    if tcp_available "$host" "$port"; then
      return 0
    fi
    attempts=$((attempts - 1))
    sleep 1
  done

  printf 'Timed out waiting for %s on %s:%s\n' "$label" "$host" "$port" >&2
  exit 1
}

cleanup() {
  for pid in ${api_pid:-} ${worker_pid:-} ${web_pid:-}; do
    if [ -n "$pid" ]; then
      kill "$pid" >/dev/null 2>&1 || true
    fi
  done
}

if [ "$(uname -s)" != "Darwin" ]; then
  printf 'run-local.sh is intended for the macOS host-only presentation path.\n' >&2
  printf 'Use ./run.sh or docker compose on other platforms.\n' >&2
  exit 1
fi

require_command python3 "Install Python 3.12+, for example with Homebrew."
require_command uv "Install uv, for example: brew install uv"
require_command pnpm "Enable pnpm, for example: corepack enable && corepack prepare pnpm@9.15.4 --activate"
require_command ffmpeg "Install ffmpeg, for example: brew install ffmpeg"

if [ -f "$SCRIPT_DIR/.env" ]; then
  set -a
  . "$SCRIPT_DIR/.env"
  set +a
fi

host_database_url=${DATABASE_URL:-postgresql+psycopg://salin:salin@localhost:5432/salin}
host_redis_url=${REDIS_URL:-redis://localhost:6379/0}
host_database_url=$(printf '%s' "$host_database_url" | sed 's/@postgres:/@localhost:/g')
host_redis_url=$(printf '%s' "$host_redis_url" | sed 's#//redis:#//localhost:#g')

export DATABASE_URL="$host_database_url"
export REDIS_URL="$host_redis_url"
export CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS:-http://localhost:3000}
export NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL:-http://localhost:8000}
export SALIN_API_INTERNAL_BASE_URL=${SALIN_API_INTERNAL_BASE_URL:-http://localhost:8000}
export PYANNOTE_DEVICE=${PYANNOTE_DEVICE:-auto}

require_tcp_port \
  "127.0.0.1" \
  "5432" \
  "Postgres" \
  "Start it with: brew services start postgresql@16"
require_tcp_port \
  "127.0.0.1" \
  "6379" \
  "Redis" \
  "Start it with: brew services start redis"

trap cleanup EXIT INT TERM

cd "$SCRIPT_DIR"

printf 'Starting Salin locally for macOS...\n'
printf 'API:    http://localhost:8000\n'
printf 'Web:    http://localhost:3000\n'
printf 'Worker: %s\n' "$REDIS_URL"

uv run --package salin-api uvicorn salin_api.main:app \
  --reload \
  --host 0.0.0.0 \
  --port 8000 &
api_pid=$!

wait_for_tcp_port "127.0.0.1" "8000" "API"

uv run --package salin-worker rq worker \
  -w rq.worker.SpawnWorker \
  salin-recordings \
  --url "$REDIS_URL" &
worker_pid=$!

pnpm --filter @salin/web dev &
web_pid=$!

wait_for_tcp_port "127.0.0.1" "3000" "web app" 90
printf 'Salin is ready at http://localhost:3000\n'

wait
