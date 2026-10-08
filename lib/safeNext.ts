// Куда вернуть после входа/регистрации (?next=/access/...). Только пути внутри сайта:
// «//evil.com» и «https://…» отбрасываем, чтобы ссылкой нельзя было увести на чужой сайт.
export function safeNext(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return null;
  return raw;
}

export function readNext(): string | null {
  if (typeof window === 'undefined') return null;
  return safeNext(new URLSearchParams(window.location.search).get('next'));
}
