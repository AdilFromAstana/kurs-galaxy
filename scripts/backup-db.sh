#!/usr/bin/env bash
# Бэкап базы данных Postgres из контейнера nail-academy-db
# Сохраняет в ./backups/db-YYYY-MM-DD_HH-MM-SS.sql.gz и оставляет последние N файлов.

set -euo pipefail

# === Настройки ===
KEEP_LAST=${KEEP_LAST:-30}
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_CONTAINER="${DB_CONTAINER:-nail-academy-db}"

# Читаем POSTGRES_* из .env (только эти ключи, чтобы не споткнуться об экзотические значения)
if [ -f ".env" ]; then
  while IFS='=' read -r KEY VAL; do
    case "$KEY" in
      POSTGRES_USER|POSTGRES_DB|POSTGRES_PASSWORD)
        # снять кавычки если есть
        VAL="${VAL%\"}"; VAL="${VAL#\"}"
        export "$KEY=$VAL"
        ;;
    esac
  done < .env
fi

DB_USER="${POSTGRES_USER:-nail}"
DB_NAME="${POSTGRES_DB:-nail_academy}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
OUT_FILE="$BACKUP_DIR/db-$TIMESTAMP.sql.gz"

echo "==> Снимаем дамп БД '$DB_NAME' из контейнера '$DB_CONTAINER'"

# pg_dump в контейнере, гзип на хосте
if ! docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --no-acl | gzip > "$OUT_FILE"; then
  echo "❌ Бэкап не удался"
  rm -f "$OUT_FILE"
  exit 1
fi

SIZE=$(du -h "$OUT_FILE" | awk '{print $1}')
echo "✅ Бэкап готов: $OUT_FILE ($SIZE)"

# Чистим старые
COUNT=$(ls -1 "$BACKUP_DIR"/db-*.sql.gz 2>/dev/null | wc -l)
if [ "$COUNT" -gt "$KEEP_LAST" ]; then
  echo "==> Удаляем старые бэкапы (оставляем последние $KEEP_LAST)"
  # shellcheck disable=SC2012
  ls -1t "$BACKUP_DIR"/db-*.sql.gz | tail -n +$((KEEP_LAST + 1)) | xargs rm -f
fi

echo "==> Все бэкапы:"
ls -lh "$BACKUP_DIR"/db-*.sql.gz | tail -5
