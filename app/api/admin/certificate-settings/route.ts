import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guard';
import {
  loadOrCreateCertificateSettings,
  updateCertificateSettings,
} from '@/lib/certificateSettings';
import { TEMPLATES_PUBLIC_LIST } from '@/lib/certificate';

export const dynamic = 'force-dynamic';

const ALLOWED_TEMPLATE_IDS = new Set(TEMPLATES_PUBLIC_LIST.map((t) => t.id));

export async function GET(req: Request) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;
  const settings = await loadOrCreateCertificateSettings(req);
  return NextResponse.json({
    settings,
    templates: TEMPLATES_PUBLIC_LIST,
  });
}

export async function PATCH(req: Request) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};

  if (typeof body.templateId === 'string') {
    if (!ALLOWED_TEMPLATE_IDS.has(body.templateId)) {
      return NextResponse.json(
        { error: 'unknown_template' },
        { status: 400 },
      );
    }
    patch.templateId = body.templateId;
  }

  for (const key of [
    'brandName',
    'brandSubtitle',
    'titleText',
    'subtitleText',
    'introText',
    'completedText',
    'instructorName',
    'publicBaseUrl',
  ] as const) {
    if (typeof body[key] === 'string') {
      patch[key] = body[key].trim();
    }
  }

  if (typeof body.qrEnabled === 'boolean') {
    patch.qrEnabled = body.qrEnabled;
  }

  await updateCertificateSettings(patch);
  const updated = await loadOrCreateCertificateSettings(req);
  return NextResponse.json({ settings: updated });
}
