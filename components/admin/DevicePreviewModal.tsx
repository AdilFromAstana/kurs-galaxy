'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Loader2, Monitor, RotateCw, Smartphone, Tablet, X } from 'lucide-react';
import { PREVIEW_MSG, type PreviewKind } from '@/lib/preview';

const DEVICES = [
  { id: 'phone', label: 'Телефон', icon: Smartphone, width: 390, height: 844 },
  { id: 'tablet', label: 'Планшет', icon: Tablet, width: 768, height: 1024 },
  { id: 'desktop', label: 'Компьютер', icon: Monitor, width: 1280, height: 800 },
] as const;
type DeviceId = (typeof DEVICES)[number]['id'];

const DEVICE_KEY = 'kg-preview-device';

export type PreviewView = { label: string; url: string };

/**
 * Окно «Так увидит посетитель»: настоящая страница сайта в iframe нужной
 * ширины (телефон / планшет / компьютер) с живым черновиком из формы.
 */
export function DevicePreviewModal({
  open,
  onClose,
  kind,
  draft,
  views,
  note,
}: {
  open: boolean;
  onClose: () => void;
  kind: PreviewKind;
  draft: unknown;
  views: PreviewView[];
  note?: string;
}) {
  const [device, setDevice] = useState<DeviceId>('phone');
  const [viewIdx, setViewIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  // Запоминаем выбранное устройство
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DEVICE_KEY) as DeviceId | null;
      if (saved && DEVICES.some((d) => d.id === saved)) setDevice(saved);
    } catch {
      /* localStorage недоступен */
    }
  }, []);
  const pickDevice = (id: DeviceId) => {
    setDevice(id);
    try {
      localStorage.setItem(DEVICE_KEY, id);
    } catch {
      /* ignore */
    }
  };

  const send = () => {
    frameRef.current?.contentWindow?.postMessage(
      { type: PREVIEW_MSG, kind, draft: draftRef.current },
      window.location.origin,
    );
  };

  // Страница в iframe сообщает «готова» — отдаём ей черновик
  useEffect(() => {
    if (!open) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.source !== frameRef.current?.contentWindow) return;
      if (e.data?.type === PREVIEW_MSG && e.data.ready === kind) {
        send();
        setLoading(false);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, kind]);

  // Живое обновление при правках в форме
  useEffect(() => {
    if (open) send();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, open]);

  // Esc закрывает, фон не прокручивается
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  // Размер сцены — чтобы вписать «экран» устройства целиком
  useLayoutEffect(() => {
    if (!open || !stageRef.current) return;
    const el = stageRef.current;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  useEffect(() => setLoading(true), [viewIdx, device, reloadKey]);

  if (!open) return null;

  const d = DEVICES.find((x) => x.id === device)!;
  const framed = device !== 'desktop';
  const bezel = framed ? 12 : 0;
  // Вписываем устройство в сцену с сохранением пропорций (не увеличиваем)
  const scale = box.w
    ? Math.min(1, (box.w - 16) / (d.width + bezel * 2), (box.h - 16) / (d.height + bezel * 2))
    : 1;
  const view = views[Math.min(viewIdx, views.length - 1)];

  // Портал в body: у страниц админки есть transform-анимации, которые ломают position: fixed
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-gray-900/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Предпросмотр"
    >
      {/* Панель управления */}
      <div className="flex flex-wrap items-center gap-3 bg-white px-4 py-3 shadow-md">
        <p className="mr-auto flex items-center gap-2 font-bold text-gray-900">
          <Eye className="h-5 w-5 text-primary-600" />
          Так увидит посетитель
        </p>

        {views.length > 1 && (
          <div className="flex overflow-x-auto rounded-lg bg-gray-100 p-1" role="tablist">
            {views.map((v, i) => (
              <button
                key={v.url}
                type="button"
                role="tab"
                aria-selected={i === viewIdx}
                onClick={() => setViewIdx(i)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  i === viewIdx ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex rounded-lg bg-gray-100 p-1" role="radiogroup" aria-label="Устройство">
          {DEVICES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={device === id}
              onClick={() => pickDevice(id)}
              title={label}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                device === id ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          title="Обновить"
          aria-label="Обновить предпросмотр"
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
        >
          <RotateCw className="h-5 w-5" />
        </button>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-700"
        >
          <X className="h-4 w-4" />
          Закрыть
        </button>
      </div>

      <p className="bg-amber-50 px-4 py-2 text-center text-xs text-amber-800 sm:text-sm">
        {note ?? 'Здесь видны и несохранённые изменения. Посетители увидят их после «Сохранить».'}
      </p>

      {/* Сцена с устройством */}
      <div ref={stageRef} className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-2">
        <div
          style={{
            width: (d.width + bezel * 2) * scale,
            height: (d.height + bezel * 2) * scale,
          }}
          className="relative shrink-0"
        >
          <div
            style={{
              width: d.width + bezel * 2,
              height: d.height + bezel * 2,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              padding: bezel,
            }}
            className={`overflow-hidden bg-white shadow-2xl ${
              framed ? 'rounded-[44px] bg-gray-950' : 'rounded-lg'
            }`}
          >
            <iframe
              key={`${view.url}|${reloadKey}`}
              ref={frameRef}
              src={view.url}
              title={`Предпросмотр: ${view.label}`}
              onLoad={() => {
                // Страница без черновика (или уже готова) — не держим спиннер вечно
                send();
                setTimeout(() => setLoading(false), 1500);
              }}
              style={{ width: d.width, height: d.height }}
              className={`block bg-white ${framed ? 'rounded-[32px]' : ''}`}
            />
          </div>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-white" />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Кнопка «Предпросмотр» в едином стиле админки. */
export function PreviewButton({
  onClick,
  label = 'Предпросмотр',
  className = '',
}: {
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border-2 border-primary-200 bg-white px-4 py-2.5 text-sm font-semibold text-primary-700 transition-colors hover:border-primary-400 hover:bg-primary-50 ${className}`}
    >
      <Eye className="h-4 w-4" />
      {label}
    </button>
  );
}
