#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"

PRESET="${1:-dfw}"
LOG_DIR="./logs/import-jobs"
mkdir -p "$LOG_DIR"
STAMP="$(date +%Y-%m-%d_%H-%M-%S)"
OUT_FILE="$LOG_DIR/import_${PRESET}_${STAMP}.json"

npm run import:jobs -- "$PRESET" | tee "$OUT_FILE"
