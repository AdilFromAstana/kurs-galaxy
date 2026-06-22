import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import {
  newAdminContext,
  SAMPLE_PNG,
  WRONG_TXT,
} from './helpers';

test.describe('Часть III: Настройки сертификата', () => {
  test.afterEach(async () => {
    // вернём базовые настройки чтобы не аффектить другие тесты
    const admin = await newAdminContext();
    await admin.patch('/api/admin/certificate-settings', {
      data: {
        templateId: 'classic-pink',
        brandName: 'KursGalaxy.kz',
        titleText: 'СЕРТИФИКАТ',
        qrEnabled: true,
      },
    });
    await admin.dispose();
  });

  test('3.73 GET certificate-settings возвращает settings + templates', async () => {
    const admin = await newAdminContext();
    const r = await admin.get('/api/admin/certificate-settings');
    expect(r.ok()).toBeTruthy();
    const body = await r.json();
    expect(body.settings).toBeTruthy();
    expect(Array.isArray(body.templates)).toBe(true);
    const ids = body.templates.map((t: any) => t.id);
    for (const tid of ['classic-pink', 'gold-elegant', 'minimal']) {
      expect(ids).toContain(tid);
    }
    await admin.dispose();
  });

  test('3.74 PATCH certificate-settings применяется', async () => {
    const admin = await newAdminContext();
    const r = await admin.patch('/api/admin/certificate-settings', {
      data: { brandName: 'Test Academy', titleText: 'СЕРТ', qrEnabled: false },
    });
    expect(r.ok()).toBeTruthy();
    const get = await admin.get('/api/admin/certificate-settings');
    const body = await get.json();
    expect(body.settings.brandName).toBe('Test Academy');
    expect(body.settings.titleText).toBe('СЕРТ');
    expect(body.settings.qrEnabled).toBe(false);
    await admin.dispose();
  });

  test('3.75 PATCH unknown templateId → 400', async () => {
    const admin = await newAdminContext();
    const r = await admin.patch('/api/admin/certificate-settings', {
      data: { templateId: 'unknown' },
    });
    expect(r.status()).toBe(400);
    expect((await r.json()).error).toBe('unknown_template');
    await admin.dispose();
  });

  test('3.76 + 3.77 + 3.83 Загрузка signature/logo и DELETE', async () => {
    const admin = await newAdminContext();
    try {
      const buf = await fs.readFile(SAMPLE_PNG);
      const sig = await admin.post('/api/admin/certificate-settings/asset', {
        multipart: {
          kind: 'signature',
          file: { name: 'sig.png', mimeType: 'image/png', buffer: buf },
        },
      });
      expect(sig.ok(), `sig → ${sig.status()} ${await sig.text().catch(() => '')}`).toBeTruthy();
      const sigBody = await sig.json();
      expect(sigBody.url).toMatch(/\/certificate-assets\//);

      const settingsRes = await admin.get('/api/admin/certificate-settings');
      expect((await settingsRes.json()).settings.signaturePath).toBe(sigBody.url);

      const logo = await admin.post('/api/admin/certificate-settings/asset', {
        multipart: {
          kind: 'logo',
          file: { name: 'logo.png', mimeType: 'image/png', buffer: buf },
        },
      });
      expect(logo.ok()).toBeTruthy();
      const logoBody = await logo.json();
      const after = await admin.get('/api/admin/certificate-settings');
      expect((await after.json()).settings.logoPath).toBe(logoBody.url);

      // DELETE signature
      const del = await admin.delete(
        '/api/admin/certificate-settings/asset?kind=signature',
      );
      expect(del.ok()).toBeTruthy();
      const finalRes = await admin.get('/api/admin/certificate-settings');
      expect((await finalRes.json()).settings.signaturePath).toBeNull();
    } finally {
      await admin.dispose();
    }
  });

  test('3.78 Asset — bad kind → 400', async () => {
    const admin = await newAdminContext();
    const buf = await fs.readFile(SAMPLE_PNG);
    const r = await admin.post('/api/admin/certificate-settings/asset', {
      multipart: {
        kind: 'other',
        file: { name: 'a.png', mimeType: 'image/png', buffer: buf },
      },
    });
    expect(r.status()).toBe(400);
    await admin.dispose();
  });

  test('3.79 Asset — нет файла → 400', async () => {
    const admin = await newAdminContext();
    const r = await admin.post('/api/admin/certificate-settings/asset', {
      multipart: { kind: 'signature' },
    });
    expect(r.status()).toBe(400);
    expect((await r.json()).error).toBe('no_file');
    await admin.dispose();
  });

  test('3.80 Asset — пустой файл → 400', async () => {
    const admin = await newAdminContext();
    const r = await admin.post('/api/admin/certificate-settings/asset', {
      multipart: {
        kind: 'signature',
        file: { name: 'empty.png', mimeType: 'image/png', buffer: Buffer.alloc(0) },
      },
    });
    expect(r.status()).toBe(400);
    expect((await r.json()).error).toBe('empty_file');
    await admin.dispose();
  });

  test('3.81 Asset — слишком большой → 413', async () => {
    const admin = await newAdminContext();
    const big = Buffer.alloc(5 * 1024 * 1024 + 10, 0);
    const r = await admin.post('/api/admin/certificate-settings/asset', {
      multipart: {
        kind: 'signature',
        file: { name: 'big.png', mimeType: 'image/png', buffer: big },
      },
    });
    expect(r.status()).toBe(413);
    await admin.dispose();
  });

  test('3.82 Asset — неправильный тип → 415', async () => {
    const admin = await newAdminContext();
    const buf = await fs.readFile(WRONG_TXT);
    const r = await admin.post('/api/admin/certificate-settings/asset', {
      multipart: {
        kind: 'signature',
        file: { name: 'wrong.txt', mimeType: 'text/plain', buffer: buf },
      },
    });
    expect(r.status()).toBe(415);
    await admin.dispose();
  });

  test('3.84 Загрузка нового signature удаляет старый файл', async () => {
    const admin = await newAdminContext();
    const buf = await fs.readFile(SAMPLE_PNG);
    const r1 = await admin.post('/api/admin/certificate-settings/asset', {
      multipart: {
        kind: 'signature',
        file: { name: 'sig1.png', mimeType: 'image/png', buffer: buf },
      },
    });
    expect(r1.ok()).toBeTruthy();
    const url1 = (await r1.json()).url as string;

    const r2 = await admin.post('/api/admin/certificate-settings/asset', {
      multipart: {
        kind: 'signature',
        file: { name: 'sig2.png', mimeType: 'image/png', buffer: buf },
      },
    });
    expect(r2.ok()).toBeTruthy();
    const url2 = (await r2.json()).url as string;
    expect(url1).not.toBe(url2);

    const file1 = path.join(process.cwd(), 'public', url1);
    const exists = await fs
      .access(file1)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(false);
    await admin.dispose();
  });

  test('3.85 Preview сертификата', async () => {
    const admin = await newAdminContext();
    const r = await admin.get('/api/admin/certificate-settings/preview');
    expect(r.ok()).toBeTruthy();
    expect(r.headers()['content-type']).toMatch(/application\/pdf/);
    expect(r.headers()['content-disposition']).toMatch(/inline/);
    await admin.dispose();
  });

  test('3.86 Preview — оба раза 200', async () => {
    const admin = await newAdminContext();
    await admin.patch('/api/admin/certificate-settings', { data: { templateId: 'minimal' } });
    const r1 = await admin.get('/api/admin/certificate-settings/preview');
    expect(r1.ok()).toBeTruthy();
    await admin.patch('/api/admin/certificate-settings', { data: { templateId: 'gold-elegant' } });
    const r2 = await admin.get('/api/admin/certificate-settings/preview');
    expect(r2.ok()).toBeTruthy();
    await admin.dispose();
  });
});
