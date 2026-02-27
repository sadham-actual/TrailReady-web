#!/usr/bin/env bash
# scripts/db-start.sh
# Start the local PostGIS container and wait until it is healthy.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "▶ Starting PostGIS container…"
docker compose up -d postgis

echo "⏳ Waiting for PostGIS to be ready…"
timeout 60 bash -c '
  until docker compose exec -T postgis pg_isready -U trailready -d trailready &>/dev/null; do
    sleep 1
  done
'

echo "✅ PostGIS is ready."
echo ""
echo "Connection string:"
echo "  postgresql://trailready:trailready@localhost:5432/trailready"
