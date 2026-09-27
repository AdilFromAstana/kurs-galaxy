'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Check, Loader2, Minus, Plus, RotateCcw, RotateCw, X } from 'lucide-react';

// Редактор кадра перед загрузкой: двигать фото пальцем/мышкой, приближать
// (ползунок, колесо, щипок), поворачивать и выбирать форму — квадрат, круг,
// 4:3 и т.д. Рядом живое превью «как на сайте». Результат режется в браузере
// на canvas и отдаётся обычным File — серверная часть загрузки не меняется.

export type CropAspect = {
  id: string;
  label: string;
  /** ширина / высота; null — пропорции самого фото */
  ratio: number | null;
  /** круглая маска (файл всё равно квадратный — круг делает вёрстка) */
  round?: boolean;
};

export const CROP = {
  square: { id: 'square', label: 'Квадрат', ratio: 1 },
  circle: { id: 'circle', label: 'Круг', ratio: 1, round: true },
  landscape: { id: '4:3', label: '4:3', ratio: 4 / 3 },
  portrait: { id: '4:5', label: '4:5', ratio: 4 / 5 },
  wide: { id: '16:10', label: '16:10', ratio: 16 / 10 },
  original: { id: 'original', label: 'Как есть', ratio: null },
} satisfies Record<string, CropAspect>;

export type CropOptions = {
  title?: string;
  /** первая — выбрана по умолчанию */
  aspects: CropAspect[];
  /** подпись к превью: где это фото появится на сайте */
  previewLabel?: string;
  /** «2 из 5» — когда режем несколько фото подряд */
  counter?: string;
  maxSide?: number;
};

type Source = File | string;

/**
 * const { cropImage, cropper } = useImageCropper();
 * const file = await cropImage(fileOrUrl, { aspects: [CROP.square] }); // null — отмена
 * ...
 * return <>{cropper}...</>;
 */
export function useImageCropper() {
  const [req, setReq] = useState<{
    id: number;
    src: Source;
    opts: CropOptions;
    resolve: (f: File | null) => void;
  } | null>(null);
  const seq = useRef(0);

  const cropImage = useCallback(
    (src: Source, opts: CropOptions) =>
      new Promise<File | null>((resolve) => setReq({ id: ++seq.current, src, opts, resolve })),
    [],
  );

  const finish = (f: File | null) => {
    req?.resolve(f);
    setReq(null);
  };

  const cropper = req ? (
    <ImageCropperModal key={req.id} src={req.src} opts={req.opts} onDone={finish} onCancel={() => finish(null)} />
  ) : null;

  return { cropImage, cropper };
}

// ─── Модалка ────────────────────────────────────────────────────────────────

const MAX_ZOOM = 5;
const LOW_RES = 500; // меньше — на сайте будет мыльно

type Pt = { x: number; y: number };

function ImageCropperModal({
  src,
  opts,
  onDone,
  onCancel,
}: {
  src: Source;
  opts: CropOptions;
  onDone: (f: File) => void;
  onCancel: () => void;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [aspect, setAspect] = useState<CropAspect>(opts.aspects[0] ?? CROP.original);
  const [rot, setRot] = useState(0); // четверти оборота
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<Pt>({ x: 0, y: 0 }); // центр кадра в пикселях фото (от центра фото)
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const [touch] = useState(() => window.matchMedia('(pointer: coarse)').matches);

  // Загрузка картинки
  useEffect(() => {
    const url = typeof src === 'string' ? src : URL.createObjectURL(src);
    const im = new Image();
    im.crossOrigin = 'anonymous'; // иначе canvas «испорчен» и toBlob не сработает
    im.decoding = 'async';
    let alive = true; // отменённая загрузка (размонтирование) не должна показывать ошибку
    im.onload = () => alive && setImg(im);
    im.onerror = () => alive && setLoadError(true);
    im.src = url;
    return () => {
      alive = false;
      if (typeof src !== 'string') URL.revokeObjectURL(url);
    };
  }, [src]);

  // Размер рабочей области
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setStage({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Прокрутка страницы под модалкой не нужна
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Размеры фото с учётом поворота
  const nw = img?.naturalWidth ?? 1;
  const nh = img?.naturalHeight ?? 1;
  const iw = rot % 2 ? nh : nw;
  const ih = rot % 2 ? nw : nh;
  const ratio = aspect.ratio ?? iw / ih;

  // Кадр в пикселях фото: максимально вписанный при zoom=1
  const base = iw / ih > ratio ? { w: ih * ratio, h: ih } : { w: iw, h: iw / ratio };
  const crop = { w: base.w / zoom, h: base.h / zoom };

  // Кадр на экране
  const pad = stage.w < 500 ? 20 : 40;
  const frameW = Math.max(40, Math.min(stage.w - pad * 2, (stage.h - pad * 2) * ratio));
  const frame = { w: frameW, h: frameW / ratio };
  const scale = frame.w / crop.w; // экранных пикселей на пиксель фото

  const clamp = useCallback(
    (c: Pt, z: number): Pt => {
      const mx = (iw - base.w / z) / 2;
      const my = (ih - base.h / z) / 2;
      return {
        x: Math.max(-mx, Math.min(mx, c.x)),
        y: Math.max(-my, Math.min(my, c.y)),
      };
    },
    [iw, ih, base.w, base.h],
  );

  // Смена формы/поворота может вывести кадр за край фото
  useEffect(() => {
    setCenter((c) => clamp(c, zoom));
  }, [clamp, zoom]);

  /** Зум с сохранением точки под курсором (f — смещение от центра кадра, экранные px) */
  const zoomTo = (z: number, f: Pt = { x: 0, y: 0 }) => {
    const nz = Math.max(1, Math.min(MAX_ZOOM, z));
    const s2 = frame.w / (base.w / nz);
    setZoom(nz);
    setCenter((c) => clamp({ x: c.x + f.x / scale - f.x / s2, y: c.y + f.y / scale - f.y / s2 }, nz));
  };

  // ── Жесты: один палец/мышь — двигать, два пальца — щипок ──
  const pointers = useRef(new Map<number, Pt>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);

  const toFrame = (e: { clientX: number; clientY: number }): Pt => {
    const r = stageRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2 };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!img) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom };
    }
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, cur);

    if (pointers.current.size >= 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      zoomTo(pinch.current.zoom * (dist / pinch.current.dist), toFrame({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 }));
      return;
    }
    const dx = cur.x - prev.x;
    const dy = cur.y - prev.y;
    setCenter((c) => clamp({ x: c.x - dx / scale, y: c.y - dy / scale }, zoom));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) setDragging(false);
  };

  // Колесо мыши / щипок на тачпаде — нужен не-passive слушатель
  const wheelRef = useRef<(e: WheelEvent) => void>();
  wheelRef.current = (e: WheelEvent) => {
    e.preventDefault();
    zoomTo(zoom * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), toFrame(e));
  };
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const h = (e: WheelEvent) => wheelRef.current?.(e);
    el.addEventListener('wheel', h, { passive: false });
    return () => el.removeEventListener('wheel', h);
  }, []);

  const rotate = (d: 1 | -1) => {
    // Центр кадра поворачиваем вместе с фото
    setCenter((c) => (d === 1 ? { x: -c.y, y: c.x } : { x: c.y, y: -c.x }));
    setRot((r) => (r + d + 4) % 4);
  };

  const reset = () => {
    setRot(0);
    setZoom(1);
    setCenter({ x: 0, y: 0 });
  };

  const apply = async () => {
    if (!img || saving) return;
    setSaving(true);
    try {
      onDone(await renderCrop(img, src, { crop, center, rot }, opts.maxSide ?? 2000));
    } catch {
      setSaving(false);
      setLoadError(true);
    }
  };

  // Клавиатура: Esc, Enter, стрелки, +/-
  const keyRef = useRef<(e: KeyboardEvent) => void>();
  keyRef.current = (e: KeyboardEvent) => {
    if (e.key === 'Escape') return onCancel();
    if ((e.target as HTMLElement)?.tagName === 'INPUT' && e.key !== 'Enter') return;
    if (e.key === 'Enter') return void apply();
    const step = 20 / scale;
    const moves: Record<string, Pt> = {
      ArrowLeft: { x: step, y: 0 },
      ArrowRight: { x: -step, y: 0 },
      ArrowUp: { x: 0, y: step },
      ArrowDown: { x: 0, y: -step },
    };
    if (moves[e.key]) {
      e.preventDefault();
      setCenter((c) => clamp({ x: c.x - moves[e.key].x, y: c.y - moves[e.key].y }, zoom));
    } else if (e.key === '+' || e.key === '=') zoomTo(zoom * 1.2);
    else if (e.key === '-') zoomTo(zoom / 1.2);
  };
  useEffect(() => {
    const h = (e: KeyboardEvent) => keyRef.current?.(e);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const outSide = Math.round(Math.max(crop.w, crop.h));
  const lowRes = !!img && Math.min(crop.w, crop.h) < LOW_RES;
  const radius = aspect.round ? '9999px' : '12px';

  /** Фото, сдвинутое так, что точка center оказывается в центре контейнера */
  const imgStyle = (s: number): CSSProperties => ({
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: nw,
    height: nh,
    maxWidth: 'none',
    transform: `translate(-50%, -50%) translate(${-center.x * s}px, ${-center.y * s}px) rotate(${rot * 90}deg) scale(${s})`,
    transformOrigin: 'center',
    willChange: 'transform',
    userSelect: 'none',
    pointerEvents: 'none',
  });

  const previewW = ratio >= 1 ? 128 : 128 * ratio;
  const previewH = previewW / ratio;
  const imgSrc = img?.src;

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-stretch justify-center bg-gray-900/80 backdrop-blur-sm md:items-center md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={opts.title ?? 'Редактировать фото'}
    >
      <div className="flex h-full w-full flex-col overflow-hidden bg-white md:h-[min(860px,100%)] md:max-w-4xl md:rounded-2xl md:shadow-2xl">
        {/* Шапка */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 md:px-5">
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-gray-900">{opts.title ?? 'Кадрирование фото'}</p>
            <p className="text-xs text-gray-500">
              {opts.counter ? `${opts.counter} · ` : ''}
              {touch ? 'Двигайте фото пальцем, приближайте двумя пальцами' : 'Двигайте фото мышкой, приближайте колёсиком'}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Рабочая область */}
        <div
          ref={stageRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={`relative min-h-0 flex-1 touch-none select-none overflow-hidden bg-[#1c1a1f] ${
            img ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : ''
          }`}
        >
          {imgSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgSrc} alt="" draggable={false} style={imgStyle(scale)} />
          )}

          {img && (
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[border-radius] duration-200"
              style={{
                width: frame.w,
                height: frame.h,
                borderRadius: aspect.round ? '9999px' : 0,
                boxShadow: '0 0 0 9999px rgba(20,18,24,0.62)',
                outline: '2px solid rgba(255,255,255,0.95)',
                outlineOffset: -1,
              }}
            >
              {/* Сетка третей — пока двигают фото */}
              <div
                className={`absolute inset-0 overflow-hidden transition-opacity duration-200 ${dragging ? 'opacity-100' : 'opacity-0'}`}
                style={{ borderRadius: 'inherit' }}
              >
                {[1, 2].map((i) => (
                  <span key={`v${i}`} className="absolute inset-y-0 w-px bg-white/50" style={{ left: `${(i * 100) / 3}%` }} />
                ))}
                {[1, 2].map((i) => (
                  <span key={`h${i}`} className="absolute inset-x-0 h-px bg-white/50" style={{ top: `${(i * 100) / 3}%` }} />
                ))}
              </div>
            </div>
          )}

          {!img && !loadError && (
            <div className="absolute inset-0 flex items-center justify-center text-white/80">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          {loadError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-white/90">
              <AlertTriangle className="h-8 w-8 text-amber-400" />
              <p>Не удалось открыть это фото для редактирования.</p>
              <p className="text-sm text-white/60">Попробуйте загрузить файл заново.</p>
            </div>
          )}
        </div>

        {/* Управление */}
        <div className="border-t border-gray-100 px-4 py-3 md:px-5">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            {opts.aspects.length > 1 && (
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Форма кадра">
                {opts.aspects.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    role="radio"
                    aria-checked={a.id === aspect.id}
                    onClick={() => setAspect(a)}
                    className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-colors ${
                      a.id === aspect.id
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <AspectIcon a={a} />
                    {a.label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex min-w-[220px] flex-1 items-center gap-2">
              <CtrlBtn label="Отдалить" onClick={() => zoomTo(zoom / 1.2)} disabled={zoom <= 1}>
                <Minus className="h-4 w-4" />
              </CtrlBtn>
              <input
                type="range"
                min={1}
                max={MAX_ZOOM}
                step={0.01}
                value={zoom}
                onChange={(e) => zoomTo(Number(e.target.value))}
                className="h-2 min-w-0 flex-1 cursor-pointer accent-primary-600"
                aria-label="Масштаб"
              />
              <CtrlBtn label="Приблизить" onClick={() => zoomTo(zoom * 1.2)} disabled={zoom >= MAX_ZOOM}>
                <Plus className="h-4 w-4" />
              </CtrlBtn>
            </div>

            <div className="flex gap-1">
              <CtrlBtn label="Повернуть влево" onClick={() => rotate(-1)}>
                <RotateCcw className="h-4 w-4" />
              </CtrlBtn>
              <CtrlBtn label="Повернуть вправо" onClick={() => rotate(1)}>
                <RotateCw className="h-4 w-4" />
              </CtrlBtn>
              <button
                type="button"
                onClick={reset}
                className="h-9 rounded-full px-3 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Сбросить
              </button>
            </div>
          </div>
        </div>

        {/* Превью + кнопки */}
        <div className="flex flex-col gap-4 border-t border-gray-100 bg-gray-50 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:flex-row sm:items-center md:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div
              className="relative shrink-0 overflow-hidden bg-gray-200 shadow-md ring-1 ring-black/5"
              style={{ width: previewW, height: previewH, borderRadius: radius }}
            >
              {imgSrc && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imgSrc} alt="" draggable={false} style={imgStyle(previewW / crop.w)} />
              )}
            </div>
            <div className="min-w-0 text-sm">
              <p className="font-semibold text-gray-900">Так будет на сайте</p>
              <p className="text-gray-500">{opts.previewLabel ?? 'Итоговое фото после обрезки'}</p>
              {img && (
                <p className={`mt-1 flex items-center gap-1 text-xs ${lowRes ? 'text-amber-600' : 'text-gray-400'}`}>
                  {lowRes && <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
                  {lowRes
                    ? 'Сильно приближено — на сайте фото может быть нечётким'
                    : `${Math.round(crop.w * Math.min(1, (opts.maxSide ?? 2000) / outSide))} × ${Math.round(crop.h * Math.min(1, (opts.maxSide ?? 2000) / outSide))} px`}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="h-11 flex-1 rounded-xl border border-gray-300 bg-white px-5 font-semibold text-gray-700 hover:bg-gray-50 sm:flex-none"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={!img || saving}
              className="inline-flex h-11 flex-[2] items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 font-semibold text-white hover:bg-primary-700 disabled:opacity-60 sm:flex-none"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Готово
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function CtrlBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function AspectIcon({ a }: { a: CropAspect }) {
  const r = a.ratio ?? 1.3;
  const w = r >= 1 ? 14 : 14 * r;
  const h = r >= 1 ? 14 / r : 14;
  return (
    <span
      aria-hidden
      className={`inline-block border-[1.5px] border-current ${a.ratio === null ? 'border-dashed' : ''}`}
      style={{ width: w, height: h, borderRadius: a.round ? 9999 : 2 }}
    />
  );
}

// ─── Нарезка ────────────────────────────────────────────────────────────────

async function renderCrop(
  img: HTMLImageElement,
  src: Source,
  { crop, center, rot }: { crop: { w: number; h: number }; center: Pt; rot: number },
  maxSide: number,
): Promise<File> {
  const k = Math.min(1, maxSide / Math.max(crop.w, crop.h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(crop.w * k));
  canvas.height = Math.max(1, Math.round(crop.h * k));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.imageSmoothingQuality = 'high';
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(k, k);
  ctx.translate(-center.x, -center.y);
  ctx.rotate((rot * Math.PI) / 2);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

  // PNG оставляем PNG (прозрачные логотипы), остальное — JPEG
  const srcName = typeof src === 'string' ? src.split('?')[0].split('/').pop() || 'photo' : src.name;
  const isPng = typeof src === 'string' ? /\.png$/i.test(srcName) : src.type === 'image/png';
  const type = isPng ? 'image/png' : 'image/jpeg';
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.9));
  if (!blob) throw new Error('toBlob');
  const name = srcName.replace(/\.[^.]+$/, '') + (isPng ? '.png' : '.jpg');
  return new File([blob], name, { type, lastModified: Date.now() });
}
