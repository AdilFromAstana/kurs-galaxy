const YOUTUBE_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
];

const YOUTUBE_ID = /^[A-Za-z0-9_-]{6,20}$/;

function normalizeId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const id = raw.trim();
  return YOUTUBE_ID.test(id) ? id : null;
}

export function parseYoutubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;

  const host = parsed.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.includes(host)) return null;

  if (host === 'youtu.be' || host === 'www.youtu.be') {
    return normalizeId(parsed.pathname.split('/')[1]);
  }
  if (parsed.pathname === '/watch') {
    return normalizeId(parsed.searchParams.get('v'));
  }
  const match = parsed.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
  if (match) return normalizeId(match[1]);

  return null;
}

export function isYoutubeUrl(url: string | null | undefined): boolean {
  return parseYoutubeId(url) !== null;
}

export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

export function youtubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
