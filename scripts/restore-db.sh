#!/usr/bin/env bash
# Восстановление БД из бэкапа.
# Использование: ./scripts/restore-db.sh ./backups/db-2026-05-07_12-00-00.sql.gz

set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Использование: $0 <путь-к-backup-файлу.sql.gz>"
  echo ""
  echo "Доступные бэкапы:"
  ls -lh ./backups/db-*.sql.gz 2>/dev/null || echo "  (нет бэкапов)"
  exit 1
fi

BACKUP_FILE="$1"
DB_CONTAINER="${DB_CONTAINER:-nail-academy-db}"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Файл не найден: $BACKUP_FILE"
  exit 1
fi

if [ -f ".env" ]; then
  while IFS='=' read -r KEY VAL; do
    case "$KEY" in
      POSTGRES_USER|POSTGRES_DB|POSTGRES_PASSWORD)
        VAL="${VAL%\"}"; VAL="${VAL#\"}"
        export "$KEY=$VAL"
        ;;
    esac
  done < .env
fi

DB_USER="${POSTGRES_USER:-nail}"
DB_NAME="${POSTGRES_DB:-nail_academy}"

echo "⚠️  ВНИМАНИЕ: текущие данные в базе '$DB_NAME' будут УДАЛЕНЫ и заменены содержимым бэкапа."
echo "    Файл: $BACKUP_FILE"
read -r -p "    Продолжить? (yes/no) " ANS
if [ "$ANS" != "yes" ]; then
  echo "Отменено"
  exit 0
fi

echo "==> Удаляем существующие таблицы (CASCADE)..."
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO $DB_USER;
GRANT ALL ON SCHEMA public TO public;
"

echo "==> Распаковываем и заливаем бэкап..."
gunzip -c "$BACKUP_FILE" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"

echo "✅ Восстановление завершено"
