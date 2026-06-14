#!/usr/bin/env sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
COMPOSE_FILE="$SCRIPT_DIR/infra/docker-compose.yml"

read_env_value() {
  key=$1
  eval "current_value=\${$key-}"
  if [ -n "${current_value:-}" ]; then
    printf '%s\n' "$current_value"
    return 0
  fi

  if [ ! -f "$SCRIPT_DIR/.env" ]; then
    return 0
  fi

  grep "^${key}=" "$SCRIPT_DIR/.env" | tail -n 1 | cut -d= -f2- || true
}

require_value() {
  value=$1
  key=$2
  if [ -z "$value" ]; then
    printf 'Missing required setting for host worker: %s\n' "$key" >&2
    exit 1
  fi
}

wait_for_tcp_port() {
  host=$1
  port=$2
  label=$3
  attempts=${4:-60}

  while [ "$attempts" -gt 0 ]; do
    if python3 -c "import socket; socket.create_connection(('''$host''', $port), timeout=1).close()" \
      >/dev/null 2>&1; then
      return 0
    fi
    attempts=$((attempts - 1))
    sleep 1
  done

  printf 'Timed out waiting for %s on %s:%s\n' "$label" "$host" "$port" >&2
  exit 1
}

cleanup_host_mode() {
  docker compose -f "$COMPOSE_FILE" down >/dev/null 2>&1 || true
}

ensure_repo_tooling_worker_dependencies() {
  tooling_python=$1
  if [ ! -x "$tooling_python" ]; then
    return 0
  fi

  diarization_provider=$(read_env_value DIARIZATION_PROVIDER)
  if [ "${diarization_provider:-}" != "pyannote" ]; then
    return 0
  fi

  if "$tooling_python" -c "import pyannote.audio" >/dev/null 2>&1; then
    return 0
  fi

  printf 'Bootstrapping host worker dependencies into %s\n' "$tooling_python" >&2
  if ! "$tooling_python" -m pip install -e "$SCRIPT_DIR/apps/api" -e "$SCRIPT_DIR/apps/worker"; then
    printf 'Could not install host worker dependencies for pyannote diarization.\n' >&2
    printf 'Install worker dependencies manually, for example with `%s -m pip install -e %s/apps/api -e %s/apps/worker`.\n' \
      "$tooling_python" "$SCRIPT_DIR" "$SCRIPT_DIR" >&2
    exit 1
  fi
}

run_host_worker() {
  host_pythonpath="$SCRIPT_DIR/apps/api:$SCRIPT_DIR/apps/worker"
  host_worker_class="rq.worker.SpawnWorker"
  if [ -n "${PYTHONPATH:-}" ]; then
    host_pythonpath="$host_pythonpath:$PYTHONPATH"
  fi

  if command -v uv >/dev/null 2>&1; then
    DATABASE_URL="$host_database_url" REDIS_URL="$host_redis_url" \
      uv run --package salin-worker rq worker -w "$host_worker_class" salin-recordings \
      --url "$host_redis_url"
    return 0
  fi

  if python3 -m uv --version >/dev/null 2>&1; then
    DATABASE_URL="$host_database_url" REDIS_URL="$host_redis_url" \
      python3 -m uv run --package salin-worker rq worker -w "$host_worker_class" \
      salin-recordings --url "$host_redis_url"
    return 0
  fi

  tooling_rq="$SCRIPT_DIR/.venv-tooling/bin/rq"
  tooling_python="$SCRIPT_DIR/.venv-tooling/bin/python"
  if [ -x "$tooling_rq" ]; then
    ensure_repo_tooling_worker_dependencies "$tooling_python"
    DATABASE_URL="$host_database_url" REDIS_URL="$host_redis_url" PYTHONPATH="$host_pythonpath" \
      "$tooling_rq" worker -w "$host_worker_class" salin-recordings --url "$host_redis_url"
    return 0
  fi

  printf 'Could not find a host worker runner for macOS run.sh.\n' >&2
  printf 'Install uv so `uv run --package salin-worker ...` works, or create %s.\n' \
    "$tooling_rq" >&2
  exit 1
}

if [ "$(uname -s)" != "Darwin" ]; then
  docker compose -f "$COMPOSE_FILE" up --build "$@"
  exit 0
fi

if [ "$#" -gt 0 ]; then
  printf 'run.sh on macOS does not accept extra compose arguments. Use docker compose directly for custom runs.\n' >&2
  exit 1
fi

database_url=$(read_env_value DATABASE_URL)
redis_url=$(read_env_value REDIS_URL)

require_value "$database_url" "DATABASE_URL"
require_value "$redis_url" "REDIS_URL"

host_database_url=$(printf '%s' "$database_url" | sed 's/@postgres:/@localhost:/g')
host_redis_url=$(printf '%s' "$redis_url" | sed 's#//redis:#//localhost:#g')

trap cleanup_host_mode EXIT INT TERM

docker compose -f "$COMPOSE_FILE" up --build --detach postgres redis api web
wait_for_tcp_port "127.0.0.1" "5432" "Postgres"
wait_for_tcp_port "127.0.0.1" "6379" "Redis"

cd "$SCRIPT_DIR"
run_host_worker
f