import crypto from 'crypto';
import { prisma } from '@/lib/db';

// Доступ к курсу по ссылке-приглашению. Технически это обычная «покупка» (Purchase),
// поэтому доступ к урокам, срок, продление и отмена работают как у оплаченного курса.

/** Служебный тариф курса для выдачи по ссылке: скрыт (isActive=false) и в продаже не виден. */
export const LINK_PLAN_NAME = 'Доступ по ссылке';

async function ensureLinkPlan(courseId: string) {
  const existing = await prisma.pricingPlan.findFirst({
    where: { courseId, name: LINK_PLAN_NAME, isActive: false },
  });
  if (existing) return existing;
  return prisma.pricingPlan.create({
    data: {
      courseId,
      name: LINK_PLAN_NAME,
      description: 'Служебный тариф для доступа по ссылке — на сайте не показывается, не удаляйте',
      accessPeriod: 'UNLIMITED',
      accessDays: null,
      price: 0,
      isActive: false,
      order: 999,
    },
  });
}

/** Короткий, но неугадываемый код ссылки: 16 символов base64url (~96 бит). */
export function newToken(): string {
  return crypto.randomBytes(12).toString('base64url');
}

export type LinkState =
  | { ok: true; link: { id: string; courseId: string; courseTitle: string; courseSlug: string; accessDays: number | null } }
  | { ok: false; reason: 'not_found' | 'disabled' | 'used_up' | 'course_hidden' };

export async function checkLink(token: string): Promise<LinkState> {
  const link = await prisma.accessLink.findUnique({
    where: { token },
    include: { course: { select: { id: true, title: true, slug: true, published: true } } },
  });
  if (!link) return { ok: false, reason: 'not_found' };
  if (!link.active) return { ok: false, reason: 'disabled' };
  if (!link.course.published) return { ok: false, reason: 'course_hidden' };
  if (link.maxUses > 0 && link.usedCount >= link.maxUses) return { ok: false, reason: 'used_up' };
  return {
    ok: true,
    link: {
      id: link.id,
      courseId: link.course.id,
      courseTitle: link.course.title,
      courseSlug: link.course.slug,
      accessDays: link.accessDays,
    },
  };
}

export type ClaimResult =
  | { ok: true; courseId: string; alreadyHad: boolean }
  | { ok: false; reason: 'not_found' | 'disabled' | 'used_up' | 'course_hidden' | 'revoked' };

/**
 * Активировать ссылку для ученицы. Если доступ к курсу уже открыт — ссылку не тратим.
 * Счётчик увеличиваем условным UPDATE, чтобы два человека не заняли последнее место одновременно.
 */
export async function claimLink(token: string, userId: string): Promise<ClaimResult> {
  const state = await checkLink(token);
  if (!state.ok) {
    // Уже активировал эту ссылку раньше (одноразовая «закончилась» на нём самом) — просто пускаем
    if (state.reason === 'used_up') {
      const own = await prisma.purchase.findFirst({
        where: { userId, accessLink: { token } },
        orderBy: { createdAt: 'desc' },
        select: { courseId: true, expiresAt: true, status: true },
      });
      if (own?.status === 'CANCELLED') return { ok: false, reason: 'revoked' };
      if (own?.status === 'ACTIVE' && (!own.expiresAt || own.expiresAt > new Date())) {
        return { ok: true, courseId: own.courseId, alreadyHad: true };
      }
    }
    return state;
  }
  const { link } = state;

  // Автор закрыла этому человеку доступ — та же ссылка его снова не откроет
  const revoked = await prisma.purchase.findFirst({
    where: { userId, accessLinkId: link.id, status: 'CANCELLED' },
    select: { id: true },
  });
  if (revoked) return { ok: false, reason: 'revoked' };

  const now = new Date();
  const current = await prisma.purchase.findFirst({
    where: {
      userId,
      courseId: link.courseId,
      status: 'ACTIVE',
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });
  if (current) return { ok: true, courseId: link.courseId, alreadyHad: true };

  const plan = await ensureLinkPlan(link.courseId);
  const expiresAt = link.accessDays ? new Date(now.getTime() + link.accessDays * 86_400_000) : null;

  const claimed = await prisma.$transaction(async (tx) => {
    const fresh = await tx.accessLink.findUnique({ where: { id: link.id } });
    if (!fresh || !fresh.active) return false;
    const { count } = await tx.accessLink.updateMany({
      where: {
        id: link.id,
        active: true,
        ...(fresh.maxUses > 0 ? { usedCount: { lt: fresh.maxUses } } : {}),
      },
      data: { usedCount: { increment: 1 } },
    });
    if (count !== 1) return false;
    await tx.purchase.create({
      data: {
        userId,
        courseId: link.courseId,
        planId: plan.id,
        status: 'ACTIVE',
        expiresAt,
        paymentAmount: 0,
        paymentStatus: 'COMPLETED',
        paymentMethod: 'access_link',
        accessLinkId: link.id,
      },
    });
    return true;
  });
  if (!claimed) return { ok: false, reason: 'used_up' };
  return { ok: true, courseId: link.courseId, alreadyHad: false };
}
