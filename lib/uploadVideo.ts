'use client';

export type UploadProgressCallback = (percent: number) => void;

export interface UploadResult {
  videoUrl: string;
  size: number;
  type: string;
}

/**
 * Загружает видеофайл на сервер с отчётом о прогрессе.
 * Использует XMLHttpRequest, потому что fetch() не даёт upload progress.
 */
export function uploadLessonVideo(
  lessonId: string,
  file: File,
  onProgress?: UploadProgressCallback,
): { promise: Promise<UploadResult>; cancel: () => void } {
  const xhr = new XMLHttpRequest();
  let cancelled = false;

  const promise = new Promise<UploadResult>((resolve, reject) => {
    const formData = new FormData();
    formData.append('video', file);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error('Некорректный ответ сервера'));
        }
      } else {
        let message = `HTTP ${xhr.status}`;
        try {
          const j = JSON.parse(xhr.responseText);
          message = j.message || j.error || message;
        } catch {
          /* ignore */
        }
        reject(new Error(message));
      }
    };

    xhr.onerror = () => {
      if (!cancelled) reject(new Error('Сеть недоступна'));
    };
    xhr.onabort = () => reject(new Error('Загрузка прервана'));

    xhr.open('POST', `/api/admin/lessons/${lessonId}/video`);
    xhr.withCredentials = true;
    xhr.send(formData);
  });

  return {
    promise,
    cancel: () => {
      cancelled = true;
      xhr.abort();
    },
  };
}
