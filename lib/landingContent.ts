import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { DEFAULTS, sanitizeLandingContent, type LandingContentData } from '@/lib/landingContentShared';

// Контент главной страницы, который автор курсов редактирует сам
// в админке (Админка → Контент сайта). Одна запись id="default".
// Типы и проверка данных — в landingContentShared (их можно импортировать в браузер).
export * from '@/lib/landingContentShared';

const SINGLETON_ID = 'default';

// ─── Чтение / запись ────────────────────────────────────────────────────────

/** Для Prisma вложенные объекты — просто JSON; форму уже проверил санитайзер. */
function toDb(data: LandingContentData) {
  return {
    ...data,
    steps: data.steps as unknown as Prisma.InputJsonArray,
    layout: data.layout as unknown as Prisma.InputJsonObject,
    texts: data.texts as unknown as Prisma.InputJsonObject,
  };
}

async function loadRow() {
  const row = await prisma.landingContent.findUnique({ where: { id: SINGLETON_ID } });
  if (row) return row;
  return prisma.landingContent.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, ...toDb(DEFAULTS) },
    update: {},
  });
}

export async function loadLandingContent(): Promise<LandingContentData> {
  // Прогоняем через санитайзер — на случай ручных правок в БД
  return sanitizeLandingContent(await loadRow());
}

/** Контент + версия (время последнего сохранения) — для редактора в админке. */
export async function loadLandingContentWithVersion(): Promise<{
  content: LandingContentData;
  version: string;
}> {
  const row = await loadRow();
  return { content: sanitizeLandingContent(row), version: row.updatedAt.toISOString() };
}

/**
 * Сохраняет контент, только если с момента загрузки (baseVersion) его никто
 * не менял. Иначе старая вкладка админки молча затёрла бы чужие правки —
 * так 29.09 из «Моих работ» пропали фото автора.
 */
export async function saveLandingContent(
  data: LandingContentData,
  baseVersion: string | null,
): Promise<'ok' | 'conflict'> {
  await loadRow(); // запись должна существовать
  const base = baseVersion ? new Date(baseVersion) : null;
  if (!base || Number.isNaN(base.getTime())) return 'conflict';
  const { count } = await prisma.landingContent.updateMany({
    where: { id: SINGLETON_ID, updatedAt: base },
    data: toDb(data),
  });
  return count === 1 ? 'ok' : 'conflict';
}
