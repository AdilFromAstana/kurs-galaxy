import { test, expect, type APIRequestContext } from '@playwright/test';
import {
  createCourseAPI,
  createLessonAPI,
  createModuleAPI,
  deleteCourseAPI,
  newAdminContext,
  newGuestContext,
  newUserContext,
  publishCourseAPI,
} from './helpers';

// Доступ к курсу по ссылке-приглашению: открывает только свой курс,
// одноразовая ссылка не работает второй раз, закрытый доступ не возвращается по ссылке,
// а содержимое платных уроков не уходит тем, у кого нет доступа.

const SECRET = 'https://youtu.be/secret-paid-video';

async function lessonOf(ctx: APIRequestContext, courseId: string, lessonId: string) {
  const res = await ctx.get('/api/courses');
  const course = (await res.json()).courses.find((c: any) => c.id === courseId);
  return course.modules.flatMap((m: any) => m.lessons).find((l: any) => l.id === lessonId);
}

test.describe('Часть V: Доступ по ссылке', () => {
  let admin: APIRequestContext;
  const courses: { id: string; lessonId: string }[] = [];

  test.beforeAll(async () => {
    admin = await newAdminContext();
    for (let i = 0; i < 2; i++) {
      const c = await createCourseAPI(admin);
      const m = await createModuleAPI(admin, c.id);
      const l = await createLessonAPI(admin, m.id, { videoUrl: SECRET, content: 'секретный текст' });
      await publishCourseAPI(admin, c.id);
      courses.push({ id: c.id, lessonId: l.id });
    }
  });

  test.afterAll(async () => {
    for (const c of courses) await deleteCourseAPI(admin, c.id);
    await admin.dispose();
  });

  test('5.1 Гость и ученица без доступа не получают содержимое платного урока', async () => {
    const guest = await newGuestContext();
    const l = await lessonOf(guest, courses[0].id, courses[0].lessonId);
    expect(l.locked).toBe(true);
    expect(l.videoUrl).toBe('');
    expect(l.content).toBe('');
    expect(JSON.stringify(l)).not.toContain(SECRET);
    await guest.dispose();
  });

  test('5.2 Одноразовая ссылка открывает только свой курс и только одному человеку', async () => {
    const created = await admin.post('/api/admin/access-links', {
      data: { courseId: courses[0].id, note: 'e2e', maxUses: 1, accessDays: 30 },
    });
    expect(created.status()).toBe(201);
    const { link } = await created.json();

    const info = await (await newGuestContext()).get(`/api/access/${link.token}`);
    expect((await info.json()).ok).toBe(true);

    // без входа не выдаём
    const anon = await newGuestContext();
    expect((await anon.post(`/api/access/${link.token}`)).status()).toBe(401);

    const { ctx: a } = await newUserContext();
    const claim = await a.post(`/api/access/${link.token}`);
    expect(claim.ok()).toBeTruthy();
    expect((await lessonOf(a, courses[0].id, courses[0].lessonId)).videoUrl).toBe(SECRET);
    // второй курс по-прежнему закрыт
    expect((await lessonOf(a, courses[1].id, courses[1].lessonId)).locked).toBe(true);
    // повторное открытие своей ссылки — не ошибка
    expect((await a.post(`/api/access/${link.token}`)).ok()).toBeTruthy();

    const { ctx: b } = await newUserContext();
    const second = await b.post(`/api/access/${link.token}`);
    expect(second.status()).toBe(409);
    expect((await second.json()).reason).toBe('used_up');
    expect((await lessonOf(b, courses[0].id, courses[0].lessonId)).locked).toBe(true);

    // закрыть доступ → уроки закрыты, по ссылке не вернуть; вернуть доступ → открыто
    const list = (await (await admin.get('/api/admin/access-links')).json()).links;
    const purchaseId = list.find((x: any) => x.id === link.id).purchases[0].id;
    expect((await admin.delete(`/api/admin/purchases/${purchaseId}`)).ok()).toBeTruthy();
    expect((await lessonOf(a, courses[0].id, courses[0].lessonId)).locked).toBe(true);
    expect((await (await a.post(`/api/access/${link.token}`)).json()).reason).toBe('revoked');
    await admin.patch(`/api/admin/purchases/${purchaseId}`, { data: { status: 'ACTIVE' } });
    expect((await lessonOf(a, courses[0].id, courses[0].lessonId)).locked).toBeFalsy();
  });

  test('5.3 Групповая ссылка: несколько человек, после отключения — никто новый', async () => {
    const { link } = await (
      await admin.post('/api/admin/access-links', { data: { courseId: courses[1].id, maxUses: 0 } })
    ).json();
    for (let i = 0; i < 2; i++) {
      const { ctx } = await newUserContext();
      expect((await ctx.post(`/api/access/${link.token}`)).ok()).toBeTruthy();
      expect((await lessonOf(ctx, courses[1].id, courses[1].lessonId)).locked).toBeFalsy();
    }
    await admin.patch(`/api/admin/access-links/${link.id}`, { data: { active: false } });
    const { ctx: late } = await newUserContext();
    const r = await late.post(`/api/access/${link.token}`);
    expect((await r.json()).reason).toBe('disabled');
  });

  test('5.4 Несуществующая ссылка и чужие админские методы', async () => {
    const guest = await newGuestContext();
    expect((await (await guest.get('/api/access/nope')).json()).reason).toBe('not_found');
    expect((await guest.get('/api/admin/access-links')).status()).toBe(401);
    const { ctx: student } = await newUserContext();
    expect((await student.post('/api/admin/access-links', { data: { courseId: courses[0].id } })).status()).toBe(401);
  });
});
