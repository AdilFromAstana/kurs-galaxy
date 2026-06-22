#!/bin/sh
set -e

echo "==> Waiting for Postgres at $DB_HOST:$DB_PORT..."
until nc -z "${DB_HOST:-db}" "${DB_PORT:-5432}"; do
  sleep 1
done
echo "==> Postgres is up."

# Если node_modules смонтировался пустой (volume), доустановим
if [ ! -d node_modules ] || [ ! -d node_modules/.prisma ]; then
  echo "==> Installing deps inside container..."
  npm install
  npx prisma generate
fi

echo "==> Applying Prisma schema (db push)..."
npx prisma db push --accept-data-loss

echo "==> Seeding (idempotent)..."
npx tsx prisma/seed.ts || node --loader ts-node/esm prisma/seed.ts || true

echo "==> Starting Next.js dev server..."
exec npm run dev
