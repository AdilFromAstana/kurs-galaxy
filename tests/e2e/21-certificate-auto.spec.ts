import { test, expect, type APIRequestContext } from '@playwright/test';
import {
  createCourseAPI,
  createLessonAPI,
  createModuleAPI,
  deleteCourseAPI,
  newAdminContext,
  newUserContext,
  publishCourseAPI,
} from './helpers';

// Сертификат выдаётся сам, как только пройден последний непройденный урок —
// в любом порядке; повторная отметка не создаёт новый; без доступа не выдаётся.

test.describe('Часть VI: Автоматическая выдача сертификата', () => {
  let admin: APIRequestContext;
  let courseId = '';
  const lessons: string[] = [];

  test.beforeAll(async () => {
    admin = await newAdminContext();
    const c = await createCourseAPI(admin);
    courseId = c.id;
    const m = await createModuleAPI(admin, c.id);
    for (let i = 0; i < 3; i++) lessons.push((await createLessonAPI(admin, m.id, { content: `урок ${i}` })).id);
    await publishCourseAPI(admin, c.id);
  });

  test.afterAll(async () => {
    await deleteCourseAPI(admin, courseId);
    await admin.dispose();
  });

  async function studentWithAccess() {
    const { ctx } = await newUserContext();
    const me = await (await ctx.get('/api/me')).json();
    const r = await admin.post('/api/admin/purchases', { data: { userId: me.user.id, courseId } });
    expect(r.ok()).toBeTruthy();
    return ctx;
  }

  test('6.1 Не по порядку: сертификат — на последнем непройденном уроке', async () => {
    const s = await studentWithAccess();
    for (const id of [lessons[2], lessons[0]]) {
      const r = await (await s.post('/api/progress', { data: { lessonId: id } })).json();
      expect(r.courseCompleted).toBe(false);
      expect(r.certificate).toBeNull();
    }
    const done = await (await s.post('/api/progress', { data: { lessonId: lessons[1] } })).json();
    expect(done.courseCompleted).toBe(true);
    expect(done.certificate.isNew).toBe(true);
    expect(done.certificate.courseId).toBe(courseId);

    // повтор — тот же сертификат, не новый
    const again = await (await s.post('/api/progress', { data: { lessonId: lessons[1] } })).json();
    expect(again.certificate).toEqual({ ...done.certificate, isNew: false });

    // PDF скачивается, номер — тот же
    const pdf = await s.get(`/api/courses/${courseId}/certificate`);
    expect(pdf.status()).toBe(200);
    expect(pdf.headers()['content-type']).toContain('application/pdf');
    expect(pdf.headers()['content-disposition']).toContain(done.certificate.id);
  });

  test('6.1b Несколько учениц проходят один курс в один день — у каждой свой сертификат', async () => {
    const ids = new Set<string>();
    for (let i = 0; i < 3; i++) {
      const s = await studentWithAccess();
      let last: any = null;
      for (const id of lessons) last = await (await s.post('/api/progress', { data: { lessonId: id } })).json();
      expect(last.courseCompleted).toBe(true);
      expect(last.certificate.isNew).toBe(true);
      ids.add(last.certificate.id);
    }
    expect(ids.size).toBe(3);
  });

  test('6.2 Без доступа к курсу сертификат не выдаётся', async () => {
    const { ctx } = await newUserContext();
    const r = await ctx.post('/api/progress', { data: { lessonId: lessons[0] } });
    expect(r.status()).toBe(403);
    const pdf = await ctx.get(`/api/courses/${courseId}/certificate`);
    expect(pdf.status()).toBe(403);
  });

  test('6.3 Закрыли доступ — новый сертификат не выдаётся', async () => {
    const s = await studentWithAccess();
    const me = await (await s.get('/api/me')).json();
    await s.post('/api/progress', { data: { lessonId: lessons[0] } });
    await s.post('/api/progress', { data: { lessonId: lessons[1] } });
    const purchaseId = me.purchases?.[0]?.id ?? (await (await s.get('/api/me')).json()).purchases[0].id;
    await admin.delete(`/api/admin/purchases/${purchaseId}`);
    const last = await s.post('/api/progress', { data: { lessonId: lessons[2] } });
    expect(last.status()).toBe(403);
  });
});
