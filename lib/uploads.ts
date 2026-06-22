import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

// Папка с загруженными видео — ВНЕ /public, чтобы Next.js не отдавал их напрямую.
// Доступ только через /api/lessons/[id]/video с проверкой авторизации.
const UPLOADS_ROOT = path.join(process.cwd(), 'uploads');
const LESSONS_DIR = path.join(UPLOADS_ROOT, 'lessons');

// Сертификатные ассеты (логотип, подпись) — публичные по URL,
// чтобы Next.js отдавал их статикой и админка могла отображать в <img>.
// Лежат в /public/certificate-assets/.
const CERTIFICATE_DIR = path.join(
  process.cwd(),
  'public',
  'certificate-assets',
);

// Префикс приватных видео — только маркер в БД, прямой статики НЕТ.
export const VIDEO_URL_PREFIX = '/uploads/lessons';
// Префикс публичных ассетов сертификата — отдаются Next-ом
export const CERTIFICATE_URL_PREFIX = '/certificate-assets';
export const LESSONS_DIR_PATH = LESSONS_DIR;
export const CERTIFICATE_DIR_PATH = CERTIFICATE_DIR;

export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg'];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 МБ

async function ensureCertificateDir(): Promise<void> {
  await fs.mkdir(CERTIFICATE_DIR, { recursive: true });
}

export function generateCertificateAssetFilename(
  kind: 'signature' | 'logo',
  originalName: string,
  mimeType: string,
): string {
  const extByMime: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
  };
  const ext =
    extByMime[mimeType] ||
    (path.extname(originalName).toLowerCase() === '.jpeg'
      ? '.jpg'
      : path.extname(originalName).toLowerCase()) ||
    '.png';
  const id = crypto.randomBytes(8).toString('hex');
  return `${kind}-${id}${ext}`;
}

export async function saveCertificateAsset(
  file: File,
  filename: string,
): Promise<string> {
  await ensureCertificateDir();
  const filePath = path.join(CERTIFICATE_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);
  return `${CERTIFICATE_URL_PREFIX}/${filename}`;
}

export function isLocalCertificateAsset(
  url: string | null | undefined,
): boolean {
  if (!url) return false;
  return url.startsWith(CERTIFICATE_URL_PREFIX + '/');
}

export async function deleteCertificateAssetIfLocal(
  url: string | null | undefined,
): Promise<void> {
  if (!isLocalCertificateAsset(url)) return;
  const filename = path.basename(url!);
  if (filename.includes('/') || filename.includes('\\')) return;
  const filePath = path.join(CERTIFICATE_DIR, filename);
  try {
    await fs.unlink(filePath);
  } catch (err: any) {
    if (err?.code !== 'ENOENT') {
      console.error('deleteCertificateAssetIfLocal error:', err);
    }
  }
}

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v',
];

export const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.m4v'];

// 200 МБ — разумный лимит для одного видеоурока в 720p
export const MAX_VIDEO_SIZE = 200 * 1024 * 1024;

async function ensureLessonsDir(): Promise<void> {
  await fs.mkdir(LESSONS_DIR, { recursive: true });
}

function pickExtension(originalName: string, mimeType: string): string {
  const fromName = path.extname(originalName).toLowerCase();
  if (ALLOWED_VIDEO_EXTENSIONS.includes(fromName)) return fromName;

  const fromMime: Record<string, string> = {
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
    'video/x-m4v': '.m4v',
  };
  return fromMime[mimeType] ?? '.mp4';
}

export function generateVideoFilename(
  originalName: string,
  mimeType: string,
): string {
  const ext = pickExtension(originalName, mimeType);
  const id = crypto.randomBytes(16).toString('hex');
  return `lesson-${id}${ext}`;
}

export async function saveLessonVideo(
  file: File,
  filename: string,
): Promise<string> {
  await ensureLessonsDir();
  const filePath = path.join(LESSONS_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);
  return `${VIDEO_URL_PREFIX}/${filename}`;
}

export function isLocalLessonVideo(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith(VIDEO_URL_PREFIX + '/');
}

/**
 * Превращает storedUrl ("/uploads/lessons/lesson-abc.mp4") в абсолютный путь на диске.
 * Возвращает null если url не является локальным видео или содержит подозрительные символы.
 */
export function resolveLocalLessonPath(
  url: string | null | undefined,
): string | null {
  if (!isLocalLessonVideo(url)) return null;
  const filename = path.basename(url!);
  if (filename.includes('/') || filename.includes('\\') || filename.startsWith('.')) {
    return null;
  }
  const resolved = path.join(LESSONS_DIR, filename);
  // Защита: убеждаемся что итоговый путь не вышел за пределы LESSONS_DIR
  if (!resolved.startsWith(LESSONS_DIR + path.sep)) return null;
  return resolved;
}

export async function deleteLessonVideoIfLocal(
  url: string | null | undefined,
): Promise<void> {
  if (!isLocalLessonVideo(url)) return;
  const filename = path.basename(url!);
  // Защита от path traversal: имя файла не должно содержать слешей
  if (filename.includes('/') || filename.includes('\\')) return;
  const filePath = path.join(LESSONS_DIR, filename);
  try {
    await fs.unlink(filePath);
  } catch (err: any) {
    // Файла уже нет — ничего страшного
    if (err?.code !== 'ENOENT') {
      console.error('deleteLessonVideoIfLocal error:', err);
    }
  }
}
