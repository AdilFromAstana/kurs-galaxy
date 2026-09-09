-- Идемпотентные DDL для боевой БД (Postgres, база "kursgalaxy").
-- Прогоняется deploy.sh перед выкаткой кода:
--   sudo -u kursgalaxy psql kursgalaxy -v ON_ERROR_STOP=1 -f scripts/prod-migrations.sql
--
-- Почему не `prisma db push`: CLI в /opt/kurs-galaxy нет (там только рантайм-standalone),
-- а DATABASE_URL в /etc/kurs-galaxy/app.env пользователю kursgalaxy не читается.
-- Поэтому схему на проде двигаем явными idempotent-выражениями. При изменении
-- prisma/schema.prisma — добавляй сюда соответствующий ALTER ... IF NOT EXISTS.

-- 2026-09: Course.isFree — курс можно в любой момент сделать бесплатным.
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "isFree" BOOLEAN NOT NULL DEFAULT false;
