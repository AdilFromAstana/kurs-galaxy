import { PrismaClient, AccessPeriodType, MaterialType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { coursesData } from '../lib/courseData';

const prisma = new PrismaClient();

const ACCESS_MAP: Record<string, AccessPeriodType> = {
  '1month': 'ONE_MONTH',
  '2months': 'TWO_MONTHS',
  '3months': 'THREE_MONTHS',
  '6months': 'SIX_MONTHS',
  '12months': 'TWELVE_MONTHS',
  unlimited: 'UNLIMITED',
};

const MATERIAL_MAP: Record<string, MaterialType> = {
  pdf: 'PDF',
  link: 'LINK',
  product: 'PRODUCT',
};

async function ensureAdmin() {
  const email = (process.env.ADMIN_EMAIL ?? 'admin@nailacademy.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? 'admin123';
  const name = process.env.ADMIN_NAME ?? 'Главный Администратор';

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    console.log(`✓ Админ уже существует: ${email}`);
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.admin.create({
    data: { email, name, passwordHash, role: 'ADMIN' },
  });
  console.log(`✓ Создан админ: ${email} / ${password}`);
}

async function ensureCourses() {
  for (const c of coursesData) {
    const slug = c.id;
    const existing = await prisma.course.findUnique({ where: { slug } });
    if (existing) {
      console.log(`✓ Курс уже есть: ${slug}`);
      continue;
    }

    const course = await prisma.course.create({
      data: { slug, title: c.title, description: c.description },
    });

    // Тарифы
    for (const p of c.pricingPlans ?? []) {
      await prisma.pricingPlan.create({
        data: {
          courseId: course.id,
          name: p.name,
          description: p.description ?? null,
          accessPeriod: ACCESS_MAP[p.accessPeriod.type] ?? 'ONE_MONTH',
          accessDays: p.accessPeriod.days ?? null,
          price: p.price,
          currency: p.currency ?? 'KZT',
          isActive: p.isActive,
          isRecommended: p.isRecommended,
          order: p.order,
        },
      });
    }

    // Модули + уроки + материалы
    for (let mi = 0; mi < c.modules.length; mi++) {
      const m = c.modules[mi];
      const mod = await prisma.module.create({
        data: {
          courseId: course.id,
          title: m.title,
          description: m.description,
          order: m.order ?? mi,
        },
      });
      for (let li = 0; li < m.lessons.length; li++) {
        const l = m.lessons[li];
        const lesson = await prisma.lesson.create({
          data: {
            moduleId: mod.id,
            title: l.title,
            duration: l.duration,
            isFree: l.isFree,
            videoUrl: l.videoUrl,
            content: l.content,
            order: l.order ?? li,
          },
        });
        for (const mat of l.materials ?? []) {
          await prisma.material.create({
            data: {
              lessonId: lesson.id,
              title: mat.title,
              url: mat.url,
              type: MATERIAL_MAP[mat.type] ?? 'LINK',
            },
          });
        }
      }
    }

    console.log(`✓ Загружен курс: ${slug} (${c.modules.length} модулей)`);
  }
}

async function main() {
  await ensureAdmin();
  await ensureCourses();
}

main()
  .catch((e) => {
    console.error('seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
