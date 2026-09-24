// Ужимает картинку в браузере перед загрузкой: фото с телефона бывают
// 5000px и 3–4 МБ, а на странице урока хватает ~2000px. Без sharp на
// сервере — прод собирается на маке, нативный бинарь в бандл не попадёт.
//
// PNG остаётся PNG (прозрачность логотипов), остальное — JPEG.
// Если сжимать нечего или браузер не справился — возвращает исходный файл.

const MAX_SIDE = 2000;
const JPEG_QUALITY = 0.85;

export async function compressImage(file: File, maxSide = MAX_SIDE): Promise<File> {
  if (typeof window === 'undefined' || !file.type.startsWith('image/')) return file;

  try {
    // imageOrientation учитывает EXIF-поворот фото с телефона
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1024 * 1024) {
      bitmap.close();
      return file;
    }

    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, type, JPEG_QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;

    const ext = type === 'image/png' ? '.png' : '.jpg';
    const name = file.name.replace(/\.[^.]+$/, '') + ext;
    return new File([blob], name, { type, lastModified: Date.now() });
  } catch {
    return file;
  }
}
