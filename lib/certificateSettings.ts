import { prisma } from '@/lib/db';
import type { CertificateSettingsData } from '@/lib/certificate';

const SINGLETON_ID = 'default';

/**
 * Возвращает текущие настройки сертификата.
 * Если записи ещё нет — создаёт со значениями по умолчанию.
 * publicBaseUrl автоматически подставляется из заголовка Origin/Host запроса
 * если в DB он не задан явно (или равен дефолтному).
 */
export async function loadOrCreateCertificateSettings(
  req?: Request,
): Promise<CertificateSettingsData> {
  let row = await prisma.certificateSettings.findUnique({
    where: { id: SINGLETON_ID },
  });
  if (!row) {
    row = await prisma.certificateSettings.create({
      data: { id: SINGLETON_ID },
    });
  }

  // Автоопределение публичного URL для QR-ссылок
  let publicBaseUrl = row.publicBaseUrl;
  if (req) {
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');
    if (origin) {
      publicBaseUrl = origin;
    } else if (host) {
      // догадываемся по протоколу
      const proto = req.headers.get('x-forwarded-proto') || 'http';
      publicBaseUrl = `${proto}://${host}`;
    }
  }

  return {
    templateId: row.templateId,
    brandName: row.brandName,
    brandSubtitle: row.brandSubtitle,
    titleText: row.titleText,
    subtitleText: row.subtitleText,
    introText: row.introText,
    completedText: row.completedText,
    signaturePath: row.signaturePath,
    instructorName: row.instructorName,
    logoPath: row.logoPath,
    qrEnabled: row.qrEnabled,
    publicBaseUrl,
  };
}

export async function updateCertificateSettings(
  patch: Partial<{
    templateId: string;
    brandName: string;
    brandSubtitle: string;
    titleText: string;
    subtitleText: string;
    introText: string;
    completedText: string;
    signaturePath: string | null;
    instructorName: string | null;
    logoPath: string | null;
    qrEnabled: boolean;
    publicBaseUrl: string;
  }>,
) {
  return prisma.certificateSettings.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, ...patch },
    update: patch,
  });
}
