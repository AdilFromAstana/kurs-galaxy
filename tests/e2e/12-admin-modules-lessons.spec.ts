import { test, expect } from '@playwright/test';
import {
  newAdminContext,
  createCourseAPI,
  createModuleAPI,
  createLessonAPI,
  deleteCourseAPI,
} from './helpers';

test.describe('Часть III: Модули, уроки, материалы', () => {
  test('3.23 + 3.24 + 3.25 Создание модуля', async () => {
    const admin = await newAdminContext();
    const c = await createCourseAPI(admin);
    try {
      // happy
      const r1 = await admin.post(`/api/admin/courses/${c.id}/modules`, {
        data: { title: 'Модуль', description: 'desc' },
      });
      expect(r1.ok()).toBeTruthy();
      const body1 = await r1.json();
      expect(typeof body1.module.order).toBe('number');

      // без title → 400
      const r2 = await admin.post(`/api/admin/courses/${c.id}/modules`, {
        data: {},
      });
      expect(r2.status()).toBe(400);

      // несуществующий курс → 404
      const r3 = await admin.post(`/api/admin/courses/no-such/modules`, {
        data: { title: 'M' },
      });
      expect(r3.status()).toBe(404);
    } finally {
      await deleteCourseAPI(admin, c.id);
      await admin.dispose();
    }
  });

  test('3.26 + 3.27 PATCH/DELETE модуля каскадно', async () => {
    const admin = await newAdminContext();
    const c = await createCourseAPI(admin);
    try {
      const m = await createModuleAPI(admin, c.id);
      const r = await admin.patch(`/api/admin/modules/${m.id}`, {
        data: { title: 'Renamed', description: 'd', order: 5 },
      });
      expect(r.ok()).toBeTruthy();
      const body = await r.json();
      expect(body.module.title).toBe('Renamed');
      expect(body.module.order).toBe(5);

      const lesson = await createLessonAPI(admin, m.id, { title: 'L' });
      const del = await admin.delete(`/api/admin/modules/${m.id}`);
      expect(del.ok()).toBeTruthy();
      const after = await admin.get(`/api/admin/lessons/${lesson.id}`);
      expect(after.status()).toBe(404);
    } finally {
      await deleteCourseAPI(admin, c.id);
      await admin.dispose();
    }
  });

  test('3.28 + 3.29 Reorder модулей', async () => {
    const admin = await newAdminContext();
    const c = await createCourseAPI(admin);
    try {
      const m1 = await createModuleAPI(admin, c.id, { title: 'm1' });
      const m2 = await createModuleAPI(admin, c.id, { title: 'm2' });
      const m3 = await createModuleAPI(admin, c.id, { title: 'm3' });

      const r = await admin.post('/api/admin/reorder/modules', {
        data: {
          items: [
            { id: m3.id, order: 0 },
            { id: m2.id, order: 1 },
            { id: m1.id, order: 2 },
          ],
        },
      });
      expect(r.ok()).toBeTruthy();

      const get = await admin.get(`/api/admin/courses/${c.id}`);
      const body = await get.json();
      const orders = body.course.modules
        .filter((m: any) => [m1.id, m2.id, m3.id].includes(m.id))
        .sort((a: any, b: any) => a.order - b.order)
        .map((m: any) => m.id);
      expect(orders[0]).toBe(m3.id);
      expect(orders[1]).toBe(m2.id);
      expect(orders[2]).toBe(m1.id);

      // пустой items → 400
      const empty = await admin.post('/api/admin/reorder/modules', {
        data: { items: [] },
      });
      expect(empty.status()).toBe(400);
    } finally {
      await deleteCourseAPI(admin, c.id);
      await admin.dispose();
    }
  });

  test('3.30 + 3.31 Создание урока — все поля и дефолты', async () => {
    const admin = await newAdminContext();
    const c = await createCourseAPI(admin);
    const m = await createModuleAPI(admin, c.id);
    try {
      const r1 = await admin.post(`/api/admin/modules/${m.id}/lessons`, {
        data: {
          title: 'Full',
          duration: '10:00',
          videoUrl: 'https://example.com/x.mp4',
          content: '# md',
          isFree: true,
        },
      });
      expect(r1.ok()).toBeTruthy();
      const b1 = await r1.json();
      expect(b1.lesson.title).toBe('Full');
      expect(b1.lesson.duration).toBe('10:00');
      expect(b1.lesson.isFree).toBe(true);

      const r2 = await admin.post(`/api/admin/modules/${m.id}/lessons`, {
        data: { title: 'Default' },
      });
      expect(r2.ok()).toBeTruthy();
      const b2 = await r2.json();
      expect(b2.lesson.duration).toBe('00:00');
      expect(b2.lesson.videoUrl).toBe('');
      expect(b2.lesson.isFree).toBe(false);
    } finally {
      await deleteCourseAPI(admin, c.id);
      await admin.dispose();
    }
  });

  test('3.32 + 3.33 PATCH/DELETE урока', async () => {
    const admin = await newAdminContext();
    const c = await createCourseAPI(admin);
    const m = await createModuleAPI(admin, c.id);
    try {
      const l = await createLessonAPI(admin, m.id, { title: 'orig' });
      const r = await admin.patch(`/api/admin/lessons/${l.id}`, {
        data: {
          title: 'new',
          duration: '07:30',
          videoUrl: 'https://example.com/v.mp4',
          content: '# c',
          isFree: true,
          order: 7,
        },
      });
      expect(r.ok()).toBeTruthy();
      const b = await r.json();
      expect(b.lesson.title).toBe('new');
      expect(b.lesson.duration).toBe('07:30');
      expect(b.lesson.isFree).toBe(true);
      expect(b.lesson.order).toBe(7);

      const del = await admin.delete(`/api/admin/lessons/${l.id}`);
      expect(del.ok()).toBeTruthy();
      const get = await admin.get(`/api/admin/lessons/${l.id}`);
      expect(get.status()).toBe(404);
    } finally {
      await deleteCourseAPI(admin, c.id);
      await admin.dispose();
    }
  });

  test('3.34 Reorder уроков', async () => {
    const admin = await newAdminContext();
    const c = await createCourseAPI(admin);
    const m = await createModuleAPI(admin, c.id);
    try {
      const a = await createLessonAPI(admin, m.id, { title: 'a' });
      const b = await createLessonAPI(admin, m.id, { title: 'b' });
      const r = await admin.post('/api/admin/reorder/lessons', {
        data: {
          items: [
            { id: b.id, order: 0 },
            { id: a.id, order: 1 },
          ],
        },
      });
      expect(r.ok()).toBeTruthy();
    } finally {
      await deleteCourseAPI(admin, c.id);
      await admin.dispose();
    }
  });

  test('3.45 + 3.46 + 3.47 + 3.48 Материалы урока', async () => {
    const admin = await newAdminContext();
    const c = await createCourseAPI(admin);
    const m = await createModuleAPI(admin, c.id);
    const l = await createLessonAPI(admin, m.id);
    try {
      const r1 = await admin.post(`/api/admin/lessons/${l.id}/materials`, {
        data: { title: 'PDF doc', url: 'https://example.com/a.pdf', type: 'PDF' },
      });
      expect(r1.ok()).toBeTruthy();
      const b1 = await r1.json();

      // type fallback на LINK
      const r2 = await admin.post(`/api/admin/lessons/${l.id}/materials`, {
        data: { title: 'Exotic', url: 'https://x', type: 'EXOTIC' },
      });
      expect(r2.ok()).toBeTruthy();
      const b2 = await r2.json();
      expect(b2.material.type).toBe('LINK');

      // без полей → 400
      const r3 = await admin.post(`/api/admin/lessons/${l.id}/materials`, {
        data: { title: '', url: '' },
      });
      expect(r3.status()).toBe(400);

      // delete
      const del = await admin.delete(`/api/admin/materials/${b1.material.id}`);
      expect(del.ok()).toBeTruthy();
      const lesson = await admin.get(`/api/admin/lessons/${l.id}`);
      const body = await lesson.json();
      const ids = body.lesson.materials.map((m: any) => m.id);
      expect(ids).not.toContain(b1.material.id);
    } finally {
      await deleteCourseAPI(admin, c.id);
      await admin.dispose();
    }
  });
});
