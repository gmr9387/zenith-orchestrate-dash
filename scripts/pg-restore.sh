#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Usage: DATABASE_URL=postgres://user:pass@host:5432/db $0 backup.sql.gz"
  exit 1
fi
if [[ $# -lt 1 ]]; then
  echo "Provide backup file path"
  exit 1
fi
FILE=$1

echo "Restoring from ${FILE}..."
gzip -dc "$FILE" | psql "$DATABASE_URL"
echo "Restore complete"