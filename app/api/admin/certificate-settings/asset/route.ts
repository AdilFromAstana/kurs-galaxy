import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guard';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  deleteCertificateAssetIfLocal,
  generateCertificateAssetFilename,
  saveCertificateAsset,
} from '@/lib/uploads';
import {
  loadOrCreateCertificateSettings,
  updateCertificateSettings,
} from '@/lib/certificateSettings';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const KINDS = ['signature', 'logo'] as const;
type AssetKind = (typeof KINDS)[number];

function isAssetKind(v: unknown): v is AssetKind {
  return typeof v === 'string' && (KINDS as readonly string[]).includes(v);
}

export async function POST(req: Request) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'invalid_form_data' }, { status: 400 });
  }

  const kind = formData.get('kind');
  if (!isAssetKind(kind)) {
    return NextResponse.json(
      { error: 'bad_kind', message: 'kind должен быть signature или logo' },
      { status: 400 },
    );
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'no_file' }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'empty_file' }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json(
      {
        error: 'file_too_large',
        message: `Максимум ${Math.floor(MAX_IMAGE_SIZE / 1024 / 1024)} МБ`,
      },
      { status: 413 },
    );
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json(
      {
        error: 'unsupported_type',
        message: 'Поддерживаются только PNG и JPG',
      },
      { status: 415 },
    );
  }

  // Удалить старое
  const current = await loadOrCreateCertificateSettings();
  const oldUrl =
    kind === 'signature' ? current.signaturePath : current.logoPath;
  await deleteCertificateAssetIfLocal(oldUrl);

  const filename = generateCertificateAssetFilename(kind, file.name, file.type);
  const url = await saveCertificateAsset(file, filename);

  await updateCertificateSettings(
    kind === 'signature' ? { signaturePath: url } : { logoPath: url },
  );

  return NextResponse.json({ url });
}

export async function DELETE(req: Request) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const url = new URL(req.url);
  const kind = url.searchParams.get('kind');
  if (!isAssetKind(kind)) {
    return NextResponse.json({ error: 'bad_kind' }, { status: 400 });
  }

  const current = await loadOrCreateCertificateSettings();
  const oldUrl =
    kind === 'signature' ? current.signaturePath : current.logoPath;
  await deleteCertificateAssetIfLocal(oldUrl);

  await updateCertificateSettings(
    kind === 'signature' ? { signaturePath: null } : { logoPath: null },
  );

  return NextResponse.json({ ok: true });
}
