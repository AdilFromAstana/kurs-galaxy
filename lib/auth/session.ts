// Подписанные сессии в cookie на Web Crypto (работает и в Node, и в Edge runtime)
import { cookies } from 'next/headers';

const USER_COOKIE = 'nail_user_session';
const ADMIN_COOKIE = 'nail_admin_session';
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 дней

export type UserSession = {
  kind: 'user';
  userId: string;
  email: string;
  name: string;
  expiresAt: number;
};

export type AdminSession = {
  kind: 'admin';
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'TEACHER';
  expiresAt: number;
};

export type AnySession = UserSession | AdminSession;

// Дефолт из .env.example, который часто остаётся в проде.
// Если он попал в production — отказываемся стартовать.
const KNOWN_DEV_SECRETS = new Set([
  'dev-secret-change-me-dev-secret-change-me',
  'change-me',
  'secret',
]);

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error('SESSION_SECRET must be set (>= 16 chars)');
  }
  if (process.env.NODE_ENV === 'production') {
    if (s.length < 32) {
      throw new Error(
        'SESSION_SECRET in production must be >= 32 chars. ' +
          'Generate with: openssl rand -hex 32',
      );
    }
    if (KNOWN_DEV_SECRETS.has(s)) {
      throw new Error(
        'SESSION_SECRET equals a known dev default. Rotate it before deploy.',
      );
    }
  }
  return s;
}

function b64urlEncode(buf: Uint8Array): string {
  let s = '';
  for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): Uint8Array {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function getKey(): Promise<CryptoKey> {
  const secret = new TextEncoder().encode(getSecret());
  return crypto.subtle.importKey(
    'raw',
    secret,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signToken(payload: object): Promise<string> {
  const body = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await getKey();
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return `${body}.${b64urlEncode(new Uint8Array(sig))}`;
}

export async function verifyToken<T extends object>(token: string): Promise<T | null> {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const key = await getKey();
  let sigBytes: Uint8Array;
  try {
    sigBytes = b64urlDecode(sig);
  } catch {
    return null;
  }
  const ok = await crypto.subtle.verify(
    'HMAC',
    key,
    sigBytes as BufferSource,
    new TextEncoder().encode(body)
  );
  if (!ok) return null;
  try {
    return JSON.parse(new TextDecoder().decode(b64urlDecode(body))) as T;
  } catch {
    return null;
  }
}

// secure cookie ставим только если приложение реально на HTTPS.
// Иначе браузер не сохранит куку и логин не будет работать.
function isHttpsApp(): boolean {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? '';
  return url.startsWith('https://');
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: isHttpsApp(),
    sameSite: 'lax' as const,
    maxAge: MAX_AGE_SEC,
    path: '/',
  };
}

const RENEW_AFTER_SEC = 60 * 60 * 24;

export function shouldRenewSession(session: { expiresAt: number }): boolean {
  const remainingSec = (session.expiresAt - Date.now()) / 1000;
  return remainingSec > 0 && remainingSec < MAX_AGE_SEC - RENEW_AFTER_SEC;
}

export async function renewedSessionCookie(session: AnySession) {
  const refreshed = { ...session, expiresAt: Date.now() + MAX_AGE_SEC * 1000 };
  return {
    name: session.kind === 'admin' ? ADMIN_COOKIE : USER_COOKIE,
    value: await signToken(refreshed),
    options: sessionCookieOptions(),
  };
}

// ===== User session =====
export async function createUserSession(data: Omit<UserSession, 'kind' | 'expiresAt'>) {
  const expiresAt = Date.now() + MAX_AGE_SEC * 1000;
  const session: UserSession = { kind: 'user', ...data, expiresAt };
  const token = await signToken(session);
  cookies().set({
    name: USER_COOKIE,
    value: token,
    ...sessionCookieOptions(),
  });
  return session;
}

export async function getUserSession(): Promise<UserSession | null> {
  const c = cookies().get(USER_COOKIE);
  if (!c) return null;
  const s = await verifyToken<UserSession>(c.value);
  if (!s || s.kind !== 'user' || s.expiresAt < Date.now()) return null;
  return s;
}

export async function clearUserSession() {
  cookies().delete(USER_COOKIE);
}

// ===== Admin session =====
export async function createAdminSession(data: Omit<AdminSession, 'kind' | 'expiresAt'>) {
  const expiresAt = Date.now() + MAX_AGE_SEC * 1000;
  const session: AdminSession = { kind: 'admin', ...data, expiresAt };
  const token = await signToken(session);
  cookies().set({
    name: ADMIN_COOKIE,
    value: token,
    ...sessionCookieOptions(),
  });
  return session;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const c = cookies().get(ADMIN_COOKIE);
  if (!c) return null;
  const s = await verifyToken<AdminSession>(c.value);
  if (!s || s.kind !== 'admin' || s.expiresAt < Date.now()) return null;
  return s;
}

export async function clearAdminSession() {
  cookies().delete(ADMIN_COOKIE);
}

export const COOKIE_NAMES = {
  USER: USER_COOKIE,
  ADMIN: ADMIN_COOKIE,
};
