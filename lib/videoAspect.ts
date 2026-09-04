const MIN_RATIO = 0.4;
const MAX_RATIO = 2.5;

const PLACEHOLDER_MAX_WIDTH = 130;
const PLACEHOLDER_MAX_HEIGHT = 100;

type Measured = { src: string; width: number; height: number };

function loadImage(src: string): Promise<Measured> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ src, width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('load_failed'));
    img.src = src;
  });
}

function isPlaceholder(img: Measured): boolean {
  return (
    !img.width ||
    !img.height ||
    (img.width <= PLACEHOLDER_MAX_WIDTH && img.height <= PLACEHOLDER_MAX_HEIGHT)
  );
}

function posterCandidates(videoId: string): string[] {
  return [
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/hq720.jpg`,
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  ];
}

export async function detectYoutubeAspect(
  videoId: string,
): Promise<number | null> {
  try {
    const img = await loadImage(`https://i.ytimg.com/vi/${videoId}/frame0.jpg`);
    if (isPlaceholder(img)) return null;
    const ratio = img.width / img.height;
    if (ratio < MIN_RATIO || ratio > MAX_RATIO) return null;
    return ratio;
  } catch {
    return null;
  }
}

export async function resolveYoutubePoster(
  videoId: string,
): Promise<string | null> {
  for (const src of posterCandidates(videoId)) {
    try {
      const img = await loadImage(src);
      if (!isPlaceholder(img)) return src;
    } catch {
      /* ignore */
    }
  }
  return null;
}
