'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';

export type LessonPhotoItem = {
  /** Стабильный ключ: id фото на сервере, либо локальный id ещё не загруженного файла */
  key: string;
  /** URL превью — blob: для локального файла или серверный путь */
  url: string;
  /** true, пока идёт загрузка на сервер (актуально для страницы редактирования) */
  uploading?: boolean;
};

const ACCEPTED_TYPES = ['image/png', 'image/jpeg'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 МБ

type Props = {
  photos: LessonPhotoItem[];
  onAdd: (files: File[]) => void;
  onRemove: (key: string) => void;
  disabled?: boolean;
  maxCount?: number;
};

/**
 * Галерея фото урока — по дизайну повторяет зону загрузки видео выше:
 * пустое состояние — большой dropzone, дальше — сетка превью с крестиком
 * по ховеру на каждой карточке и плиткой "добавить" в конце сетки.
 */
export function LessonPhotoGallery({
  photos,
  onAdd,
  onRemove,
  disabled = false,
  maxCount = 12,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remainingSlots = Math.max(0, maxCount - photos.length);
  const canAdd = !disabled && remainingSlots > 0;

  const pickFiles = (fileList: FileList | File[] | null) => {
    if (!fileList || disabled) return;
    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;

    const valid: File[] = [];
    let rejectedType = false;
    let rejectedSize = false;

    for (const f of incoming) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        rejectedType = true;
        continue;
      }
      if (f.size > MAX_SIZE) {
        rejectedSize = true;
        continue;
      }
      valid.push(f);
    }

    if (valid.length === 0) {
      setError(
        rejectedSize
          ? 'Каждое фото — максимум 5 МБ'
          : 'Можно загружать только PNG или JPG',
      );
      return;
    }

    const trimmed = valid.slice(0, remainingSlots);
    setError(
      trimmed.length < valid.length
        ? `Можно добавить ещё максимум ${remainingSlots} фото`
        : rejectedType
          ? 'Некоторые файлы пропущены — можно только PNG или JPG'
          : rejectedSize
            ? 'Некоторые файлы пропущены — максимум 5 МБ каждое'
            : null,
    );

    if (trimmed.length > 0) onAdd(trimmed);
  };

  const dropHandlers = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      if (canAdd) setDragOver(true);
    },
    onDragLeave: () => setDragOver(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (canAdd) pickFiles(e.dataTransfer.files);
    },
  };

  return (
    <div>
      {photos.length === 0 ? (
        <div
          onClick={() => canAdd && inputRef.current?.click()}
          {...dropHandlers}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            disabled
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : dragOver
                ? 'border-primary-500 bg-primary-50 cursor-pointer'
                : 'border-gray-300 cursor-pointer hover:border-primary-500 hover:bg-primary-50'
          }`}
        >
          <ImagePlus className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-700 font-medium mb-1">
            Нажмите или перетащите фото сюда
          </p>
          <p className="text-sm text-gray-500">
            PNG, JPG — до 5 МБ, максимум {maxCount} шт.
          </p>
        </div>
      ) : (
        <div
          {...dropHandlers}
          className={`grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 rounded-lg transition-colors ${
            dragOver ? 'ring-2 ring-primary-400 ring-offset-2' : ''
          }`}
        >
          {photos.map((photo) => (
            <div
              key={photo.key}
              className="group relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50"
            >
              <img
                src={photo.url}
                alt=""
                className={`w-full h-full object-cover transition-opacity ${
                  photo.uploading ? 'opacity-40' : ''
                }`}
              />
              {photo.uploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/40">
                  <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onRemove(photo.key)}
                  disabled={disabled}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity disabled:opacity-0"
                  aria-label="Удалить фото"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}

          {canAdd && (
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
              className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
                dragOver
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-primary-400 bg-gray-50 hover:bg-primary-50/60'
              }`}
            >
              <ImagePlus className="w-5 h-5 text-primary-500" />
              <span className="text-[11px] text-gray-500 font-medium text-center px-1">
                Добавить
              </span>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        multiple
        className="hidden"
        onChange={(e) => {
          pickFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-500">
          PNG/JPG, до 5 МБ каждое
        </p>
        <p className="text-xs text-gray-400">
          {photos.length}/{maxCount}
        </p>
      </div>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
