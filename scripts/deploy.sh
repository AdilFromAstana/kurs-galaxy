#!/usr/bin/env bash
# Выкатка KursGalaxy на прод одной командой:  npm run deploy
#
# Что делает (по порядку):
#   1. npm run build            — сборка standalone локально (на сервере next build НЕЛЬЗЯ: MemoryMax=512M)
#   2. бэкап боевой БД          — sudo /usr/local/bin/kurs-galaxy-backup.sh
#   3. миграции схемы           — scripts/prod-migrations.sql (idempotent DDL)
#   4. rsync кода в /opt/kurs-galaxy (standalone + static + public), с защитой симлинков uploads/ассетов
#   5. systemctl restart kurs-galaxy
#   6. проверка: сервис активен + HTTP 200 с боевого домена
#
# Прод — это НЕ Docker: systemd-сервис kurs-galaxy, Next.js standalone в /opt/kurs-galaxy,
# владелец — сервисный юзер kursgalaxy (шелл nologin, поэтому только `sudo -u kursgalaxy bash -c`).
#
# Требования на машине разработчика: node/npm, rsync, ssh-доступ к $SERVER по ключу.
set -euo pipefail

SERVER="${DEPLOY_SERVER:-deploy@188.241.217.134}"
APP_DIR="${DEPLOY_APP_DIR:-/opt/kurs-galaxy}"
SVC="${DEPLOY_SVC:-kurs-galaxy}"
SITE="${DEPLOY_SITE:-https://kurs.188-241-217-134.sslip.io/}"
DB_USER="${DEPLOY_DB_USER:-kursgalaxy}"
DB_NAME="${DEPLOY_DB_NAME:-kursgalaxy}"
RSYNC_AS_SVC="sudo -u ${DB_USER} rsync"

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

# --- 0. префлайт -------------------------------------------------------------
command -v rsync >/dev/null || { echo "нет rsync"; exit 1; }
ssh -o BatchMode=yes -o ConnectTimeout=10 "$SERVER" 'echo ok' >/dev/null \
  || { echo "нет ssh-доступа к $SERVER (нужен ключ)"; exit 1; }

if [[ -n "$(git status --porcelain 2>/dev/null || true)" ]]; then
  echo "⚠  рабочее дерево грязное — деплоим текущее состояние файлов:"
  git status --short
  read -r -p "продолжить? [y/N] " a; [[ "$a" == y || "$a" == Y ]] || exit 1
fi
say "деплой $(git rev-parse --short HEAD 2>/dev/null || echo '?')  →  $SERVER:$APP_DIR"

# --- 1. сборка -------------------------------------------------------------
say "1/6  npm run build"
npm run build
test -f "$ROOT/.next/standalone/server.js" || { echo "нет .next/standalone — сборка не дала standalone (next.config: output:'standalone')"; exit 1; }
test -f "$ROOT/.next/standalone/node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node" \
  || { echo "в бандле нет linux-движка Prisma (schema.prisma binaryTargets должен включать debian-openssl-3.0.x)"; exit 1; }

# --- 2. бэкап БД -------------------------------------------------------------
say "2/6  бэкап боевой БД"
ssh "$SERVER" 'sudo /usr/local/bin/kurs-galaxy-backup.sh'
BACKUP="$(ssh "$SERVER" 'ls -t /var/backups/kurs-galaxy/db-*.dump | head -1')"
echo "бэкап: $BACKUP   (откат:  sudo -u '"$DB_USER"' pg_restore -c -d '"$DB_NAME"' \"$BACKUP\")"

# --- 3. миграции схемы ------------------------------------------------------
say "3/6  миграции схемы (idempotent DDL)"
ssh "$SERVER" "sudo -u ${DB_USER} psql ${DB_NAME} -v ON_ERROR_STOP=1 -f -" < "$ROOT/scripts/prod-migrations.sql"

# --- 4. выкатка кода ------------------------------------------------------
# ВНИМАНИЕ: public/{course-thumbnails,lesson-photos,lesson-covers,certificate-assets}
# и uploads/ — симлинки в /var/lib/kurs-galaxy (загруженные видео, обложки, ассеты
# сертификата). Они в --exclude, иначе --delete их снесёт.
say "4/6  rsync standalone"
rsync -az --delete --rsync-path="$RSYNC_AS_SVC" \
  --exclude '/public' --exclude '/uploads' --exclude '/.next/cache' \
  "$ROOT/.next/standalone/" "$SERVER:$APP_DIR/"

say "4/6  rsync static"
rsync -az --delete --rsync-path="$RSYNC_AS_SVC" \
  "$ROOT/.next/static/" "$SERVER:$APP_DIR/.next/static/"

say "4/6  rsync public (без ассет-симлинков)"
rsync -az --rsync-path="$RSYNC_AS_SVC" \
  --exclude '/certificate-assets' --exclude '/lesson-photos' \
  --exclude '/course-thumbnails' --exclude '/lesson-covers' \
  "$ROOT/public/" "$SERVER:$APP_DIR/public/"

# --- 5. рестарт -------------------------------------------------------------
say "5/6  systemctl restart $SVC"
ssh "$SERVER" "sudo systemctl restart $SVC"

# --- 6. проверка -------------------------------------------------------------
say "6/6  проверка"
sleep 3
ssh "$SERVER" "sudo systemctl is-active $SVC && sudo journalctl -u $SVC -n 20 --no-pager"
code="$(curl -s -o /dev/null -w '%{http_code}' "$SITE" || true)"
echo "GET $SITE  ->  $code"
[[ "$code" == 200 || "$code" == 301 || "$code" == 302 ]] \
  && say "готово ✅  $SITE" \
  || { echo "⚠  сайт ответил $code — смотри логи выше, при необходимости откат из $BACKUP"; exit 1; }
