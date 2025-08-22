#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Usage: DATABASE_URL=postgres://user:pass@host:5432/db $0 [output.sql.gz]"
  exit 1
fi
OUT_FILE=${1:-pg-backup-$(date +%Y%m%d-%H%M%S).sql.gz}

echo "Backing up to ${OUT_FILE}..."
pg_dump --no-owner --format=plain "$DATABASE_URL" | gzip -c > "$OUT_FILE"
echo "Backup complete: ${OUT_FILE}"