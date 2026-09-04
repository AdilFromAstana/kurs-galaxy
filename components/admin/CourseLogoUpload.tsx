'use client';

import { useEffect, useRef, useState } from 'react';
import { BookOpen, Camera, X } from 'lucide-react';

const MAX_SIZE = 5 * 1024 * 1024; // 5 МБ
const ACCEPTED = ['image/png', 'image/jpeg'];

type Props = {
  /** Уже сохранённый на сервере URL лого (при редактировании курса) */
  savedUrl: string | null;
  /** Новый файл, выбранный пользователем, но ещё не отправленный на сервер */
  file: File | null;
  onFileSelect: (file: File) => void;
  /** Сбросить и сохранённый URL, и локально выбранный файл */
  onRemove: () => void;
  size?: number;
  className?: string;
};

/**
 * Кликабельная/drag-n-drop зона для лого курса. Заменяет собой дефолтную
 * иконку-книжку: пока лого не выбрано — показывает книжку-плейсхолдер,
 * после выбора — превью с overlay для замены и крестиком для удаления.
 *
 * Файл загружается на сервер не сразу, а только при сабмите формы
 * (см. страницы create/edit) — так на диске не остаётся "осиротевших"
 * файлов, если пользователь передумает и уйдёт со страницы.
 */
export function CourseLogoUpload({
  savedUrl,
  file,
  onFileSelect,
  onRemove,
  size = 72,
  className = '',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const displayUrl = previewUrl ?? savedUrl;

  const pick = (f: File | undefined | null) => {
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) {
      setError('Только PNG или JPG');
      return;
    }
    if (f.size > MAX_SIZE) {
      setError('Максимум 5 МБ');
      return;
    }
    setError(null);
    onFileSelect(f);
  };

  return (
    <div className={`flex-shrink-0 ${className}`}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          pick(e.dataTransfer.files?.[0]);
        }}
        style={{ width: size, height: size }}
        className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-colors ${
          displayUrl
            ? 'border border-gray-200'
            : `border-2 border-dashed ${
                dragOver
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-primary-400 bg-primary-50/60'
              }`
        }`}
        aria-label={
          displayUrl ? 'Изменить логотип курса' : 'Загрузить логотип курса'
        }
      >
        {displayUrl ? (
          <>
            <img
              src={displayUrl}
              alt="Логотип курса"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
              <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setError(null);
                onRemove();
              }}
              className="absolute top-1 right-1 w-5 h-5 bg-white/90 hover:bg-white text-gray-700 rounded-full flex items-center justify-center shadow-sm"
              aria-label="Удалить логотип"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-primary-400 group-hover:text-primary-500 transition-colors">
            <BookOpen className="w-7 h-7" />
            <Camera className="w-3.5 h-3.5 absolute bottom-1.5 right-1.5 opacity-70" />
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {error && (
        <p className="mt-1 text-[11px] text-red-600 max-w-[7rem] leading-tight">
          {error}
        </p>
      )}
    </div>
  );
}
