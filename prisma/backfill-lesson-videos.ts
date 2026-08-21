import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Переносит одиночный Lesson.videoUrl в таблицу LessonVideo.
 * Идемпотентно: уроки, у которых уже есть videos, пропускаются.
 * Запускать один раз после `npm run db:push`.
 */
async function main() {
  const lessons = await prisma.lesson.findMany({
    include: { videos: { select: { id: true } } },
  });

  let created = 0;
  let skipped = 0;

  for (const lesson of lessons) {
    if (lesson.videos.length > 0) {
      skipped++;
      continue;
    }
    if (!lesson.videoUrl || !lesson.videoUrl.trim()) {
      skipped++;
      continue;
    }

    await prisma.lessonVideo.create({
      data: {
        lessonId: lesson.id,
        title: 'Видео 1',
        url: lesson.videoUrl.trim(),
        duration: lesson.duration || null,
        order: 0,
      },
    });
    created++;
  }

  console.log(`Backfill завершён: создано ${created}, пропущено ${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
