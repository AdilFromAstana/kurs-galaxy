#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> 1/4 Проверяю .env.dev"
if [ ! -f .env.dev ]; then
  echo "    .env.dev не найден — создаю из .env.dev.example"
  cp .env.dev.example .env.dev
fi

set -a
. ./.env.dev
set +a
APP_PORT=${APP_PORT:-3000}
APP_URL="http://localhost:${APP_PORT}"

if ! docker ps --filter name=nail-academy-app --filter status=running -q | grep -q .; then
  if lsof -nP -iTCP:"${APP_PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "    !! порт ${APP_PORT} уже занят другим процессом."
    echo "       Освободи его или поменяй APP_PORT в .env.dev и запусти снова."
    exit 1
  fi
fi

echo "==> 2/4 Поднимаю docker (db + app, с билдом)"
docker compose --env-file .env.dev up -d --build

echo "==> 3/4 Жду готовности Next-сервера на ${APP_URL}"
for i in $(seq 1 90); do
  code=$(curl -s -o /dev/null -w "%{http_code}" "${APP_URL}" || echo 000)
  if [ "$code" = "200" ] || [ "$code" = "307" ] || [ "$code" = "302" ]; then
    echo "    Сервер готов (HTTP $code)"
    break
  fi
  sleep 2
  [ "$i" = "90" ] && { echo "    !! Сервер не поднялся за отведённое время, смотри логи: npm run docker:logs"; exit 1; }
done

echo "==> 4/4 Заливаю демо-данные (идемпотентно)"
docker compose --env-file .env.dev exec -T app node scripts/test-data-seed.js

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Готово → ${APP_URL}"
echo "  Админка:   /admin/login   admin@nailacademy.com / admin123"
echo "  Студент:   /auth/login    student@nailacademy.kz / Student2026!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
