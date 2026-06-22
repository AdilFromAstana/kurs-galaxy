// Удаляет всё, что создал test-data-seed.js:
// - админа kamila@nailacademy.kz
// - тестового студента test@nailacademy.kz (со всеми его purchases/progress)
// - курс manicure-pro-2026 (со всеми модулями/уроками/планами/покупками — каскадно)
//
// Запуск (с локальной машины):
//   cat scripts/test-data-cleanup.js | ssh root@109.235.118.108 "docker exec -i nail-academy-app node"

const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  // Курс — каскадно потянет за собой модули/уроки/материалы/планы/покупки/прогресс
  const courseRes = await p.course.deleteMany({
    where: { slug: 'manicure-pro-2026' },
  });
  console.log('✓ Удалён курс manicure-pro-2026:', courseRes.count);

  // Студенты — каскадно их purchases/progress/lastLessons/videoPos/resetTokens
  const userRes = await p.user.deleteMany({
    where: { email: { in: ['test@nailacademy.kz', 'student@nailacademy.kz'] } },
  });
  console.log('✓ Удалены студенты (test@..., student@...):', userRes.count);

  // Админы — Камила и Демо Автор
  const adminRes = await p.admin.deleteMany({
    where: {
      email: { in: ['kamila@nailacademy.kz', 'demo-author@nailacademy.kz'] },
    },
  });
  console.log('✓ Удалены админы (kamila@..., demo-author@...):', adminRes.count);

  await p.$disconnect();
})().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});
