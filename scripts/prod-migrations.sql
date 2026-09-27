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

-- 2026-09: LessonPhoto.caption — необязательная подпись под фото урока.
ALTER TABLE "LessonPhoto" ADD COLUMN IF NOT EXISTS "caption" TEXT;

-- 2026-09: Lead — заявки из формы «Остались вопросы?» на главной.
CREATE TABLE IF NOT EXISTS "Lead" (
  "id"        TEXT PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "phone"     TEXT NOT NULL,
  "handled"   BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Lead_createdAt_idx" ON "Lead"("createdAt");

-- 2026-09: LandingContent — контент главной (автор, работы, результаты, отзывы, FAQ).
CREATE TABLE IF NOT EXISTS "LandingContent" (
  "id"          TEXT PRIMARY KEY DEFAULT 'default',
  "authorName"  TEXT,
  "authorRole"  TEXT,
  "authorPhoto" TEXT,
  "authorBio"   TEXT,
  "authorFacts" JSONB NOT NULL DEFAULT '[]',
  "works"       JSONB NOT NULL DEFAULT '[]',
  "results"     JSONB NOT NULL DEFAULT '[]',
  "reviews"     JSONB NOT NULL DEFAULT '[]',
  "faq"         JSONB NOT NULL DEFAULT '[]',
  "updatedAt"   TIMESTAMP(3) NOT NULL
);

-- 2026-09: LandingContent.authorWorks — галерея «Мои работы» (работы автора курсов).
ALTER TABLE "LandingContent" ADD COLUMN IF NOT EXISTS "authorWorks" JSONB NOT NULL DEFAULT '[]';
