#!/usr/bin/env bash
# scripts/db-migrate.sh
# Run all SQL migrations (in filename order) against the local PostGIS DB.
#
# Usage:
#   scripts/db-migrate.sh               # run all migrations
#   scripts/db-migrate.sh 002_*.sql     # run specific file(s)
#
# Requires: docker (compose), psql available via `docker compose exec`
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

MIGRATIONS_DIR="supabase/migrations"

# Override via env: PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-trailready}"
PGPASSWORD="${PGPASSWORD:-trailready}"
PGDATABASE="${PGDATABASE:-trailready}"

# Check if we should use docker compose exec (default) or a local psql
if [[ "${USE_LOCAL_PSQL:-0}" == "1" ]]; then
  run_sql() {
    PGPASSWORD="$PGPASSWORD" psql \
      -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" \
      -f "$1"
  }
else
  run_sql() {
    docker compose exec -T postgis \
      psql -U "$PGUSER" -d "$PGDATABASE" -f - < "$1"
  }
fi

# Determine files to run
if [[ $# -gt 0 ]]; then
  FILES=("$@")
else
  mapfile -t FILES < <(find "$MIGRATIONS_DIR" -name "*.sql" | sort)
fi

if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "No migration files found in $MIGRATIONS_DIR"
  exit 1
fi

echo "▶ Running migrations against postgresql://$PGUSER@$PGHOST:$PGPORT/$PGDATABASE"
echo ""

for f in "${FILES[@]}"; do
  echo "  → $(basename "$f")"
  run_sql "$f"
done

echo ""
echo "✅ All migrations complete."
