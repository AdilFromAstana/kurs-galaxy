import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import {
  newAdminContext,
  newUserContext,
  createCourseAPI,
  createModuleAPI,
  createLessonAPI,
  deleteCourseAPI,
  uploadVideoFixtureAPI,
  SAMPLE_MP4,
  WRONG_TXT,
} from './helpers';

test.describe('Часть III: Загрузка видео', () => {
  test('3.35 + 3.36 Upload happy + delete', async () => {
    const admin = await newAdminContext();
    const c = await createCourseAPI(admin);
    const m = await createModuleAPI(admin, c.id);
    const l = await createLessonAPI(admin, m.id);
    try {
      const up = await uploadVideoFixtureAPI(admin, l.id);
      expect(up.videoUrl).toBeTruthy();

      const get = await admin.get(`/api/admin/lessons/${l.id}`);
      const body = await get.json();
      expect(body.lesson.videoUrl).toBe(up.videoUrl);

      const del = await admin.delete(`/api/admin/lessons/${l.id}/video`);
      expect(del.ok()).toBeTruthy();
      const get2 = await admin.get(`/api/admin/lessons/${l.id}`);
      expect((await get2.json()).lesson.videoUrl).toBe('');
    } finally {
      await deleteCourseAPI(admin, c.id);
      await admin.dispose();
    }
  });

  test('3.37 Upload — нет файла → 400 no_file', async () => {
    const admin = await newAdminContext();
    const c = await createCourseAPI(admin);
    const m = await createModuleAPI(admin, c.id);
    const l = await createLessonAPI(admin, m.id);
    try {
      const r = await admin.post(`/api/admin/lessons/${l.id}/video`, {
        multipart: {},
      });
      expect(r.status()).toBe(400);
      expect((await r.json()).error).toBe('no_file');
    } finally {
      await deleteCourseAPI(admin, c.id);
      await admin.dispose();
    }
  });

  test('3.38 Upload — пустой файл → 400 empty_file', async () => {
    const admin = await newAdminContext();
    const c = await createCourseAPI(admin);
    const m = await createModuleAPI(admin, c.id);
    const l = await createLessonAPI(admin, m.id);
    try {
      const r = await admin.post(`/api/admin/lessons/${l.id}/video`, {
        multipart: {
          video: { name: 'empty.mp4', mimeType: 'video/mp4', buffer: Buffer.alloc(0) },
        },
      });
      expect(r.status()).toBe(400);
      expect((await r.json()).error).toBe('empty_file');
    } finally {
      await deleteCourseAPI(admin, c.id);
      await admin.dispose();
    }
  });

  test('3.39 Upload — слишком большой → 413 file_too_large', async () => {
    test.slow();
    const admin = await newAdminContext();
    const c = await createCourseAPI(admin);
    const m = await createModuleAPI(admin, c.id);
    const l = await createLessonAPI(admin, m.id);
    try {
      // 200 MB + 1 байт. Buffer.alloc большой — может занять память;
      // выделяем по чанкам через sparse-буфер (alloc заполняет нулями).
      const size = 200 * 1024 * 1024 + 1;
      const buffer = Buffer.alloc(size, 0);
      const r = await admin.post(`/api/admin/lessons/${l.id}/video`, {
        multipart: {
          video: { name: 'big.mp4', mimeType: 'video/mp4', buffer },
        },
        timeout: 120_000,
      });
      expect(r.status()).toBe(413);
      expect((await r.json()).error).toBe('file_too_large');
    } finally {
      await deleteCourseAPI(admin, c.id);
      await admin.dispose();
    }
  });

  test('3.40 Upload — неправильный тип → 415', async () => {
    const admin = await newAdminContext();
    const c = await createCourseAPI(admin);
    const m = await createModuleAPI(admin, c.id);
    const l = await createLessonAPI(admin, m.id);
    try {
      const buf = await fs.readFile(WRONG_TXT);
      const r = await admin.post(`/api/admin/lessons/${l.id}/video`, {
        multipart: {
          video: { name: 'wrong.txt', mimeType: 'text/plain', buffer: buf },
        },
      });
      expect(r.status()).toBe(415);
      expect((await r.json()).error).toBe('unsupported_type');
    } finally {
      await deleteCourseAPI(admin, c.id);
      await admin.dispose();
    }
  });

  test('3.41 Upload — несуществующий lesson → 404', async () => {
    const admin = await newAdminContext();
    const buf = await fs.readFile(SAMPLE_MP4);
    const r = await admin.post('/api/admin/lessons/no-such-id/video', {
      multipart: {
        video: { name: 'a.mp4', mimeType: 'video/mp4', buffer: buf },
      },
    });
    expect(r.status()).toBe(404);
    expect((await r.json()).error).toBe('lesson_not_found');
    await admin.dispose();
  });

  test('3.42 Повторная загрузка удаляет старый файл', async () => {
    const admin = await newAdminContext();
    const c = await createCourseAPI(admin);
    const m = await createModuleAPI(admin, c.id);
    const l = await createLessonAPI(admin, m.id);
    try {
      const up1 = await uploadVideoFixtureAPI(admin, l.id);
      const up2 = await uploadVideoFixtureAPI(admin, l.id);
      expect(up1.videoUrl).not.toBe(up2.videoUrl);

      // первый файл удалён с диска
      const filename1 = path.basename(up1.videoUrl);
      const exists = await fs
        .access(path.join(process.cwd(), 'uploads', 'lessons', filename1))
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(false);
    } finally {
      await deleteCourseAPI(admin, c.id);
      await admin.dispose();
    }
  });

  test('3.43 + 3.44 Стрим админа vs стрим юзера без покупки', async () => {
    const admin = await newAdminContext();
    const c = await createCourseAPI(admin);
    const m = await createModuleAPI(admin, c.id);
    const paid = await createLessonAPI(admin, m.id, { isFree: false });
    try {
      await uploadVideoFixtureAPI(admin, paid.id);

      // admin — 200/206
      const a = await admin.get(`/api/lessons/${paid.id}/video`);
      expect([200, 206]).toContain(a.status());

      // user без покупки — 403 no_access
      const { ctx } = await newUserContext();
      const u = await ctx.get(`/api/lessons/${paid.id}/video`);
      expect(u.status()).toBe(403);
      expect((await u.json()).error).toBe('no_access');
      await ctx.dispose();
    } finally {
      await deleteCourseAPI(admin, c.id);
      await admin.dispose();
    }
  });
});
