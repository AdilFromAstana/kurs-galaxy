'use client';

import { useRef, useState } from 'react';
import {
  Video,
  Upload,
  X,
  Play,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { confirmToast } from '@/lib/toastConfirm';
import { uploadLessonVideo } from '@/lib/uploadVideo';
import {
  type VideoDraft,
  type LessonVideoDTO,
  newDraftKey,
  fromDTO,
  adminPreviewSrc,
} from '@/lib/lessonVideos';

const MAX_FILE_SIZE = 200 * 1024 * 1024;

interface Props {
  /** null — режим черновика: изменения хранятся локально до создания урока. */
  lessonId: string | null;
  videos: VideoDraft[];
  onChange: (videos: VideoDraft[]) => void;
  disabled?: boolean;
}

export default function LessonVideosManager({
  lessonId,
  videos,
  onChange,
  disabled = false,
}: Props) {
  const live = lessonId !== null;

  const [adding, setAdding] = useState(false);
  const [addMethod, setAddMethod] = useState<'url' | 'file'>('url');
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [openPreview, setOpenPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBusy = disabled || busy;

  const resetForm = () => {
    setAdding(false);
    setAddMethod('url');
    setNewUrl('');
    setNewTitle('');
    setNewDuration('');
    setNewFile(null);
    setFormError(null);
    setUploadPercent(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError(null);

    if (!file.type.startsWith('video/')) {
      setFormError('Можно загружать только видео-файлы');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFormError(
        `Файл слишком большой: ${(file.size / 1024 / 1024).toFixed(1)} МБ. Максимум 200 МБ`,
      );
      return;
    }

    setNewFile(file);

    // Автоопределение длительности из метаданных файла
    const blobUrl = URL.createObjectURL(file);
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.src = blobUrl;
    probe.onloadedmetadata = () => {
      if (Number.isFinite(probe.duration)) {
        const m = Math.floor(probe.duration / 60);
        const s = Math.floor(probe.duration % 60);
        setNewDuration(`${m}:${s.toString().padStart(2, '0')}`);
      }
      URL.revokeObjectURL(blobUrl);
    };
  };

  const handleAdd = async () => {
    setFormError(null);

    if (addMethod === 'url' && !newUrl.trim()) {
      setFormError('Укажите URL видео');
      return;
    }
    if (addMethod === 'file' && !newFile) {
      setFormError('Выберите видео-файл');
      return;
    }

    const title = newTitle.trim() || `Видео ${videos.length + 1}`;

    if (!live) {
      onChange([
        ...videos,
        {
          key: newDraftKey(),
          id: null,
          title,
          duration: newDuration.trim(),
          url: addMethod === 'url' ? newUrl.trim() : '',
          file: addMethod === 'file' ? newFile : null,
        },
      ]);
      resetForm();
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}/videos`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          duration: newDuration.trim(),
          url: addMethod === 'url' ? newUrl.trim() : '',
        }),
      });
      if (!res.ok) throw new Error('Не удалось добавить видео');
      const { video } = (await res.json()) as { video: LessonVideoDTO };

      let saved = video;
      if (addMethod === 'file' && newFile) {
        setUploadPercent(0);
        const { promise } = uploadLessonVideo(
          lessonId!,
          newFile,
          (p) => setUploadPercent(p),
          video.id,
        );
        const result = await promise;
        saved = { ...video, url: result.videoUrl };
      }

      onChange([...videos, fromDTO(saved)]);
      toast.success('Видео добавлено');
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'Ошибка при добавлении видео');
    } finally {
      setBusy(false);
      setUploadPercent(0);
    }
  };

  const updateLocal = (key: string, patch: Partial<VideoDraft>) => {
    onChange(videos.map((v) => (v.key === key ? { ...v, ...patch } : v)));
  };

  const persistMeta = async (v: VideoDraft) => {
    if (!live || !v.id) return;
    const res = await fetch(
      `/api/admin/lessons/${lessonId}/videos/${v.id}`,
      {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: v.title, duration: v.duration }),
      },
    );
    if (!res.ok) toast.error('Не удалось сохранить видео');
  };

  const handleDelete = async (v: VideoDraft) => {
    const ok = await confirmToast({
      message: `Удалить видео «${v.title || 'без названия'}»?`,
      confirmText: 'Удалить',
      destructive: true,
    });
    if (!ok) return;

    if (live && v.id) {
      const res = await fetch(
        `/api/admin/lessons/${lessonId}/videos/${v.id}`,
        { method: 'DELETE', credentials: 'include' },
      );
      if (!res.ok) {
        toast.error('Не удалось удалить видео');
        return;
      }
      toast.success('Видео удалено');
    }
    onChange(videos.filter((x) => x.key !== v.key));
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= videos.length) return;

    const next = [...videos];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);

    if (live && next.every((v) => v.id)) {
      const res = await fetch(
        `/api/admin/lessons/${lessonId}/videos/reorder`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: next.map((v) => v.id) }),
        },
      );
      if (!res.ok) {
        toast.error('Не удалось изменить порядок');
        onChange(videos);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 md:p-6 shadow-soft border border-gray-100">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Video className="w-5 h-5" />
          Видео урока
        </h2>
        <span className="text-sm text-gray-500 flex-shrink-0">
          {videos.length}
        </span>
      </div>

      {videos.length === 0 && !adding && (
        <div className="text-center py-8 px-4 border-2 border-dashed border-gray-200 rounded-xl mb-4">
          <Video className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">
            Пока нет видео. Добавьте хотя бы одно.
          </p>
        </div>
      )}

      {/* Список видео */}
      <div className="space-y-3">
        {videos.map((v, i) => (
          <div
            key={v.key}
            className="border border-gray-200 rounded-xl p-3 md:p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 flex-shrink-0 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
                {i + 1}
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <input
                  type="text"
                  value={v.title}
                  onChange={(e) => updateLocal(v.key, { title: e.target.value })}
                  onBlur={() => persistMeta(v)}
                  placeholder={`Видео ${i + 1}`}
                  disabled={isBusy}
                  className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={v.duration}
                    onChange={(e) =>
                      updateLocal(v.key, { duration: e.target.value })
                    }
                    onBlur={() => persistMeta(v)}
                    placeholder="12:30"
                    disabled={isBusy}
                    className="w-28 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 truncate min-w-0">
                    {v.file ? `${v.file.name} — загрузится позже` : v.url || '—'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={isBusy || i === 0}
                  className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-30"
                  aria-label="Выше"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={isBusy || i === videos.length - 1}
                  className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-30"
                  aria-label="Ниже"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={() =>
                  setOpenPreview(openPreview === v.key ? null : v.key)
                }
                disabled={!adminPreviewSrc(v)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg disabled:opacity-40"
              >
                <Play className="w-3.5 h-3.5" />
                {openPreview === v.key ? 'Скрыть' : 'Предпросмотр'}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(v)}
                disabled={isBusy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-lg disabled:opacity-50 ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Удалить
              </button>
            </div>

            {openPreview === v.key && adminPreviewSrc(v) && (
              <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mt-3">
                <video
                  src={adminPreviewSrc(v)}
                  controls
                  controlsList="nodownload"
                  className="w-full h-full"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Форма добавления */}
      {adding ? (
        <div className="mt-4 border border-primary-200 bg-primary-50/40 rounded-xl p-4">
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                setAddMethod('url');
                setNewFile(null);
                setFormError(null);
              }}
              disabled={isBusy}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                addMethod === 'url'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              URL видео
            </button>
            <button
              type="button"
              onClick={() => {
                setAddMethod('file');
                setNewUrl('');
                setFormError(null);
              }}
              disabled={isBusy}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                addMethod === 'file'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Загрузить файл
            </button>
          </div>

          {formError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{formError}</p>
            </div>
          )}

          <div className="space-y-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={`Название (по умолчанию «Видео ${videos.length + 1}»)`}
              disabled={isBusy}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            />

            {addMethod === 'url' ? (
              <div>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  disabled={isBusy}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Прямая ссылка на видео-файл (.mp4, .webm). YouTube/Vimeo пока
                  не поддерживаются — используйте загрузку файла.
                </p>
              </div>
            ) : !newFile ? (
              <div
                onClick={() => !isBusy && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors bg-white ${
                  isBusy
                    ? 'border-gray-200 cursor-not-allowed'
                    : 'border-gray-300 cursor-pointer hover:border-primary-500 hover:bg-primary-50'
                }`}
              >
                <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-700 font-medium text-sm mb-0.5">
                  Нажмите для выбора видео
                </p>
                <p className="text-xs text-gray-500">MP4, WebM, MOV — до 200 МБ</p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3 min-w-0">
                  <Video className="w-5 h-5 text-primary-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {newFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(newFile.size / 1024 / 1024).toFixed(2)} МБ
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  disabled={isBusy}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                  aria-label="Убрать файл"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <input
              type="text"
              value={newDuration}
              onChange={(e) => setNewDuration(e.target.value)}
              placeholder="Длительность, напр. 12:30"
              disabled={isBusy}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-m4v,video/*"
              onChange={handleFilePick}
              className="hidden"
            />
          </div>

          {busy && uploadPercent > 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="font-medium text-blue-900">Загрузка видео...</span>
                <span className="font-semibold text-blue-700">
                  {uploadPercent}%
                </span>
              </div>
              <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-200"
                  style={{ width: `${uploadPercent}%` }}
                />
              </div>
              <p className="text-xs text-blue-700 mt-2">
                Не закрывайте вкладку до завершения
              </p>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={resetForm}
              disabled={isBusy}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={isBusy}
              className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-lg disabled:opacity-50"
            >
              {busy ? 'Добавление...' : 'Добавить'}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          disabled={isBusy}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Добавить видео
        </button>
      )}
    </div>
  );
}
