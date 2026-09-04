'use client';

import { useRef, useState } from 'react';
import { Image as ImageIcon, Upload, Trash2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { confirmToast } from '@/lib/toastConfirm';
import { youtubeCoverFor } from '@/lib/lessonCover';

interface Props {
  lessonId: string;
  coverUrl: string | null;
  videos: { url: string; order: number }[];
  videoUrl?: string | null;
  onChange: (coverUrl: string | null) => void;
  disabled?: boolean;
}

export default function LessonCoverManager({
  lessonId,
  coverUrl,
  videos,
  videoUrl,
  onChange,
  disabled = false,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBusy = disabled || busy;
  const auto = youtubeCoverFor({ videos, videoUrl });
  const shown = coverUrl || auto;

  const handleFile = async (file: File) => {
    setError(null);
    setBusy(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch(`/api/admin/lessons/${lessonId}/cover`, {
        method: 'POST',
        credentials: 'include',
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || 'Не удалось загрузить обложку');
        return;
      }
      onChange(data.lesson.coverUrl);
      toast.success('Обложка обновлена');
    } catch {
      setError('Не удалось загрузить обложку');
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    const ok = await confirmToast({
      message: 'Удалить обложку урока?',
      confirmText: 'Удалить',
      destructive: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}/cover`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        setError('Не удалось удалить обложку');
        return;
      }
      onChange(null);
      toast.success('Обложка удалена');
    } catch {
      setError('Не удалось удалить обложку');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 md:p-6 shadow-soft border border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
        <ImageIcon className="w-5 h-5" />
        Обложка урока
      </h2>

      <div className="flex items-start gap-4 flex-wrap">
        <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
          {shown ? (
            <img src={shown} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-8 h-8 text-gray-300" />
          )}
        </div>

        <div className="flex-1 min-w-[220px] space-y-3">
          <p className="text-sm text-gray-600">
            {coverUrl
              ? 'Своя загруженная картинка.'
              : auto
                ? 'Сейчас подставлено превью с YouTube. Загрузите файл, чтобы заменить.'
                : 'Обложки нет. Загрузите картинку или добавьте видео с YouTube — превью подставится само.'}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => !isBusy && fileInputRef.current?.click()}
              disabled={isBusy}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {busy ? 'Загружаю…' : coverUrl ? 'Заменить' : 'Загрузить'}
            </button>

            {coverUrl && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isBusy}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Удалить
              </button>
            )}
          </div>

          <p className="text-xs text-gray-500">PNG, JPEG или WebP, до 5 МБ</p>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
