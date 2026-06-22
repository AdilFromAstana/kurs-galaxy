import { PDFDocument, PDFFont, PDFImage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import QRCode from 'qrcode';
import fs from 'node:fs/promises';
import path from 'node:path';
import { renderClassicPink } from './certificateTemplates/classic-pink';
import { renderMinimal } from './certificateTemplates/minimal';
import { renderGoldElegant } from './certificateTemplates/gold-elegant';

const FONT_DIR = path.join(process.cwd(), 'public', 'fonts');

// Кеш шрифтов в памяти процесса
let fontRegularCache: Uint8Array | null = null;
let fontBoldCache: Uint8Array | null = null;

async function loadFonts() {
  if (!fontRegularCache) {
    fontRegularCache = await fs.readFile(
      path.join(FONT_DIR, 'Inter-Regular.ttf'),
    );
  }
  if (!fontBoldCache) {
    fontBoldCache = await fs.readFile(path.join(FONT_DIR, 'Inter-Bold.ttf'));
  }
  return { regular: fontRegularCache, bold: fontBoldCache };
}

export interface CertificateData {
  recipientName: string;
  courseTitle: string;
  completedAt: Date;
  certificateId: string;
}

export interface CertificateSettingsData {
  templateId: string;
  brandName: string;
  brandSubtitle: string;
  titleText: string;
  subtitleText: string;
  introText: string;
  completedText: string;
  signaturePath?: string | null;
  instructorName?: string | null;
  logoPath?: string | null;
  qrEnabled: boolean;
  publicBaseUrl: string;
}

export interface RenderContext {
  pdf: PDFDocument;
  fonts: { regular: PDFFont; bold: PDFFont };
  data: CertificateData;
  settings: CertificateSettingsData;
  assets: {
    signature: PDFImage | null;
    logo: PDFImage | null;
    qr: PDFImage | null;
  };
}

export const TEMPLATE_REGISTRY: Record<
  string,
  { id: string; label: string; description: string; render: (ctx: RenderContext) => Promise<void> }
> = {
  'classic-pink': {
    id: 'classic-pink',
    label: 'Классика',
    description: 'Розовая палитра, двойная рамка, медалька',
    render: renderClassicPink,
  },
  minimal: {
    id: 'minimal',
    label: 'Минимализм',
    description: 'Чистый белый, крупная типографика, без декора',
    render: renderMinimal,
  },
  'gold-elegant': {
    id: 'gold-elegant',
    label: 'Премиум',
    description: 'Тёмный фон с золотыми акцентами',
    render: renderGoldElegant,
  },
};

export const TEMPLATES_PUBLIC_LIST = Object.values(TEMPLATE_REGISTRY).map(
  ({ id, label, description }) => ({ id, label, description }),
);

const PUBLIC_DIR = path.join(process.cwd(), 'public');

async function loadImageFromPublic(
  pdf: PDFDocument,
  storedPath: string | null | undefined,
): Promise<PDFImage | null> {
  if (!storedPath) return null;
  // storedPath = "/certificate-assets/..." — снимаем ведущий слеш
  if (!storedPath.startsWith('/')) return null;
  const rel = storedPath.replace(/^\/+/, '');
  const safeRel = path.normalize(rel);
  if (safeRel.includes('..')) return null;
  const full = path.join(PUBLIC_DIR, safeRel);
  try {
    const buf = await fs.readFile(full);
    const isPng =
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47;
    if (isPng) return await pdf.embedPng(buf);
    return await pdf.embedJpg(buf);
  } catch {
    return null;
  }
}

async function generateQrImage(
  pdf: PDFDocument,
  url: string,
): Promise<PDFImage | null> {
  try {
    const buffer = await QRCode.toBuffer(url, {
      width: 300,
      margin: 0,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#18181b',
        light: '#ffffff',
      },
    });
    return await pdf.embedPng(buffer);
  } catch (err) {
    console.error('QR generation failed:', err);
    return null;
  }
}

export async function renderCertificatePdf(
  data: CertificateData,
  settings: CertificateSettingsData,
): Promise<Uint8Array> {
  const { regular: regBytes, bold: boldBytes } = await loadFonts();

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const regular = await pdf.embedFont(regBytes);
  const bold = await pdf.embedFont(boldBytes);

  const signature = await loadImageFromPublic(pdf, settings.signaturePath);
  const logo = await loadImageFromPublic(pdf, settings.logoPath);

  let qr: PDFImage | null = null;
  if (settings.qrEnabled) {
    const verifyUrl = `${settings.publicBaseUrl.replace(/\/+$/, '')}/cert/verify/${encodeURIComponent(data.certificateId)}`;
    qr = await generateQrImage(pdf, verifyUrl);
  }

  const ctx: RenderContext = {
    pdf,
    fonts: { regular, bold },
    data,
    settings,
    assets: { signature, logo, qr },
  };

  const tpl =
    TEMPLATE_REGISTRY[settings.templateId] ?? TEMPLATE_REGISTRY['classic-pink'];
  await tpl.render(ctx);

  return await pdf.save();
}

/**
 * Стабильный человекочитаемый ID сертификата.
 * Дата + 6 символов хеша из (userId+courseId).
 */
export function buildCertificateId(input: {
  userId: string;
  courseId: string;
  completedAt: Date;
}): string {
  const stamp = input.completedAt.toISOString().slice(0, 10).replace(/-/g, '');
  const tail = (input.userId + input.courseId)
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(-6)
    .toUpperCase();
  return `${stamp}-${tail}`;
}

export function formatDateRu(date: Date): string {
  const months = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} г.`;
}
