#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

export SESSION_SECRET=${SESSION_SECRET:-mock-mode-session-secret-local-only}
export NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-http://localhost:${PORT:-3000}}
export ADMIN_EMAIL=${ADMIN_EMAIL:-admin@nailacademy.com}
export ADMIN_PASSWORD=${ADMIN_PASSWORD:-admin123}
unset DATABASE_URL

RESET=${MOCK_RESET:-0}
[ "${1:-}" = "--reset" ] && RESET=1

echo "==> 1/3 Собираю мок-схему (SQLite вместо Postgres)"
node scripts/mock/build-schema.js
npx prisma generate --schema prisma/schema.mock.prisma >/dev/null

if [ ! -f prisma/mock.db ] || [ "$RESET" = "1" ]; then
  echo "==> 2/3 Создаю prisma/mock.db и заливаю данные из mocks/*.json"
  npx prisma db push --schema prisma/schema.mock.prisma --force-reset --skip-generate >/dev/null
  node scripts/mock/seed.js
else
  echo "==> 2/3 prisma/mock.db уже есть — оставляю данные как есть"
  echo "    (пересобрать из mocks/*.json: npm run dev:mock -- --reset)"
  npx prisma db push --schema prisma/schema.mock.prisma --skip-generate >/dev/null
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  МОК-РЕЖИМ: база — файл prisma/mock.db, данные — mocks/*.json"
echo "  Postgres и Docker не нужны."
echo ""
echo "  Админка:   /admin/login   admin@nailacademy.com / admin123"
echo "  Студент:   /auth/login    student@nailacademy.kz / Student2026!"
echo ""
echo "  Вернуться на обычный режим (Postgres): npm run db:generate"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "==> 3/3 Старт Next"
exec npx next dev
