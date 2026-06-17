#!/usr/bin/env bash

set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <root@droplet-ip>"
  exit 1
fi

DROPLET=$1
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
ROOT_DIR=$(dirname "$SCRIPT_DIR")

echo "==> Syncing repository to droplet..."
rsync -a --exclude 'node_modules' \
         --exclude '.next' \
         --exclude '.git' \
         --exclude '.venv' \
         --exclude '.venv-tooling' \
         --exclude 'apps/web/node_modules' \
         --exclude 'apps/api/.venv' \
         --exclude 'apps/worker/.venv' \
         --exclude 'apps/api/__pycache__' \
         --exclude 'apps/worker/__pycache__' \
         "$ROOT_DIR/" "$DROPLET:/opt/salin"

echo "==> Deploying..."
ssh "$DROPLET" "cd /opt/salin && docker compose -f infra/docker-compose.prod.yml up --build -d"
echo "==> Done!"
