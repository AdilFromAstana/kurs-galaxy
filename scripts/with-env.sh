#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -z "${DATABASE_URL:-}" ]; then
  if [ ! -f .env.dev ]; then
    echo "==> .env.dev не найден — создаю из .env.dev.example"
    cp .env.dev.example .env.dev
  fi
  set -a
  . ./.env.dev
  set +a
fi

exec "$@"
