'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, X } from 'lucide-react';

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
  className?: string;
};

/**
 * Крупный аватар-логотип курса с загрузкой по клику или drag-n-drop.
 * Размер адаптивный: 128px на мобильном, до 192px на десктопе. Пока лого
 * не выбрано — приглашающий плейсхолдер; после выбора — превью с мягкой
 * тенью, ховер-оверлеем «Заменить» и кнопкой удаления в углу.
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

  const openPicker = () => inputRef.current?.click();

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
      <div className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48">
        <div
          role="button"
          tabIndex={0}
          onClick={openPicker}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openPicker();
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
          aria-label={
            displayUrl ? 'Изменить логотип курса' : 'Загрузить логотип курса'
          }
          className={`group relative w-full h-full rounded-[1.75rem] overflow-hidden cursor-pointer bg-white transition duration-200 ring-1 ring-gray-900/5 shadow-[0_10px_34px_-8px_rgba(17,24,39,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
            displayUrl
              ? dragOver
                ? 'ring-2 ring-primary-500'
                : 'hover:shadow-[0_16px_40px_-8px_rgba(17,24,39,0.28)]'
              : ''
          }`}
        >
          {displayUrl ? (
            <>
              <img
                src={displayUrl}
                alt="Логотип курса"
                className="w-full h-full object-cover transition duration-300 group-hover:scale-[1.03] group-hover:brightness-90"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Camera className="w-6 h-6 text-white drop-shadow" />
                <span className="text-xs font-semibold text-white drop-shadow">
                  Заменить
                </span>
              </div>
            </>
          ) : (
            <div
              className={`w-full h-full flex flex-col items-center justify-center gap-2 rounded-[1.75rem] border-2 border-dashed transition-colors ${
                dragOver
                  ? 'border-primary-400 bg-primary-50'
                  : 'border-gray-300 bg-primary-50/40 group-hover:border-primary-400 group-hover:bg-primary-50'
              }`}
            >
              <span className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary-500">
                <ImagePlus className="w-6 h-6" />
              </span>
              <span className="text-xs font-semibold text-gray-600">
                Загрузить фото
              </span>
              <span className="text-[11px] text-gray-400">PNG, JPG · до 5 МБ</span>
            </div>
          )}
        </div>

        {displayUrl && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setError(null);
              onRemove();
            }}
            className="absolute -top-2.5 -right-2.5 w-8 h-8 rounded-full bg-white text-gray-600 shadow-md ring-1 ring-gray-900/5 flex items-center justify-center transition hover:text-red-600 hover:scale-105 active:scale-95"
            aria-label="Удалить логотип"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-600 max-w-[12rem] leading-tight">
          {error}
        </p>
      )}

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
    </div>
  );
}
