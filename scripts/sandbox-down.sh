#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Stopping Postgres container..."
docker compose -f "$PROJECT_DIR/docker-compose.yml" down

echo "Done. Data is preserved in the Docker volume."
echo "To delete all data: docker compose -f $PROJECT_DIR/docker-compose.yml down -v"
