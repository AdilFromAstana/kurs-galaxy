// Простой in-memory rate-limit с фиксированным окном.
// Подходит для одного процесса Next.js (как сейчас в docker-compose).
// Для multi-instance продакшена заменить на Redis (например, Upstash).

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Каждые 5 минут чистим протухшие записи, чтобы Map не рос бесконечно.
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 5 * 60_000) return;
  lastSweep = now;
  for (const [k, v] of buckets) {
    if (v.resetAt <= now) buckets.delete(k);
  }
}

export type RateLimitResult = {
  ok: boolean;
  retryAfterSec: number; // сколько секунд ждать (0 если ok)
  remaining: number;
};

export function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): RateLimitResult {
  // Вне продакшена лимит отключён, чтобы не мешать локальному тестированию.
  if (process.env.NODE_ENV !== 'production') {
    return { ok: true, retryAfterSec: 0, remaining: max };
  }

  const now = Date.now();
  sweep(now);

  const cur = buckets.get(key);
  if (!cur || cur.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0, remaining: max - 1 };
  }
  if (cur.count >= max) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((cur.resetAt - now) / 1000)),
      remaining: 0,
    };
  }
  cur.count += 1;
  return { ok: true, retryAfterSec: 0, remaining: max - cur.count };
}

// Сбросить лимит для ключа (например, после успешного логина).
export function rateLimitReset(key: string): void {
  buckets.delete(key);
}

// Получить IP клиента из стандартных Next-заголовков. Для тестов из localhost
// все запросы выглядят как 127.0.0.1, поэтому в тестах нужно использовать
// уникальные email — лимит ключуется по `email|ip`.
export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}

// Только для тестов — полная очистка состояния.
export function __rateLimitFlushAll(): void {
  buckets.clear();
}
