import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guard';
import { renderCertificatePdf } from '@/lib/certificate';
import { loadOrCreateCertificateSettings } from '@/lib/certificateSettings';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const settings = await loadOrCreateCertificateSettings(req);
  const sampleData = {
    recipientName: 'Анна Иванова',
    courseTitle: 'Brow Master Pro — Профессиональный курс бровиста',
    completedAt: new Date(),
    certificateId: 'PREVIEW-DEMO',
  };

  const pdf = await renderCertificatePdf(sampleData, settings);

  return new Response(pdf as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(pdf.length),
      'Content-Disposition': 'inline; filename="preview.pdf"',
      'Cache-Control': 'no-store',
    },
  });
}
