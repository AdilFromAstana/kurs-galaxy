'use client';

import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import YoutubePlayer from './YoutubePlayer';
import { detectYoutubeAspect, resolveYoutubePoster } from '@/lib/videoAspect';

interface VideoPlayerProps {
  lessonId: string;
  /** Конкретное видео урока. Без него играет легаси-видео урока целиком. */
  videoId?: string;
  /** Оставлен для обратной совместимости — реально не используется,
   *  плеер всегда ходит через защищённый эндпоинт. */
  videoUrl?: string;
  onEnded?: () => void;
}

type Source =
  | { kind: 'youtube'; youtubeId: string }
  | { kind: 'file'; src: string };

const DEFAULT_ASPECT = 16 / 9;
const MAX_HEIGHT_VH = 78;

export default function VideoPlayer({
  lessonId,
  videoId,
  onEnded,
}: VideoPlayerProps) {
  const streamSrc = videoId
    ? `/api/lessons/videos/${videoId}`
    : `/api/lessons/${lessonId}/video`;
  const sourceSrc = videoId
    ? `/api/lessons/videos/${videoId}/source`
    : `/api/lessons/${lessonId}/video-source`;

  const { isAuthenticated } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSeek = useRef<number | null>(null);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [source, setSource] = useState<Source | null>(null);
  const [startAt, setStartAt] = useState(0);
  const [resolved, setResolved] = useState(false);
  const [aspect, setAspect] = useState(DEFAULT_ASPECT);
  const [started, setStarted] = useState(false);
  const [poster, setPoster] = useState<string | null>(null);

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  useEffect(() => {
    let cancelled = false;
    pendingSeek.current = null;
    setResolved(false);
    setStarted(false);
    setSource(null);
    setStartAt(0);
    setAspect(DEFAULT_ASPECT);
    setPoster(null);

    (async () => {
      const positionQuery = videoId
        ? `lessonId=${encodeURIComponent(lessonId)}&videoId=${encodeURIComponent(videoId)}`
        : `lessonId=${encodeURIComponent(lessonId)}`;

      const [sourceRes, positionRes] = await Promise.all([
        fetch(sourceSrc, { credentials: 'include' }).catch(() => null),
        isAuthenticated
          ? fetch(`/api/video-position?${positionQuery}`, {
              credentials: 'include',
            }).catch(() => null)
          : Promise.resolve(null),
      ]);

      let nextSource: Source = { kind: 'file', src: streamSrc };
      if (sourceRes?.ok) {
        try {
          const data = await sourceRes.json();
          if (data.kind === 'youtube' && data.videoId) {
            nextSource = { kind: 'youtube', youtubeId: data.videoId };
          }
        } catch {
          /* ignore */
        }
      }

      let time = 0;
      if (positionRes?.ok) {
        try {
          const data = await positionRes.json();
          if (typeof data.time === 'number') time = data.time;
        } catch {
          /* ignore */
        }
      }

      if (cancelled) return;
      setSource(nextSource);
      setStartAt(time);
      if (time > 0 && nextSource.kind === 'file') pendingSeek.current = time;
      setResolved(true);

      if (nextSource.kind === 'youtube') {
        const [detected, posterSrc] = await Promise.all([
          detectYoutubeAspect(nextSource.youtubeId),
          resolveYoutubePoster(nextSource.youtubeId),
        ]);
        if (cancelled) return;
        if (detected) setAspect(detected);
        setPoster(posterSrc);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lessonId, videoId, isAuthenticated, sourceSrc, streamSrc]);

  const persistTime = (time: number) => {
    if (!isAuthenticated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch('/api/video-position', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, videoId, time }),
      }).catch(() => {});
    }, 1500);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) persistTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    if (pendingSeek.current != null) {
      video.currentTime = pendingSeek.current;
      pendingSeek.current = null;
    }
    video.playbackRate = speed;
    if (video.videoWidth && video.videoHeight) {
      setAspect(video.videoWidth / video.videoHeight);
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (videoRef.current) videoRef.current.playbackRate = newSpeed;
    setShowSpeedMenu(false);
  };

  const youtubeId = source?.kind === 'youtube' ? source.youtubeId : null;

  return (
    <div className="relative w-full">
      <div
        className="relative mx-auto w-full overflow-hidden rounded-lg md:rounded-2xl bg-black shadow-soft"
        style={{
          aspectRatio: String(aspect),
          maxWidth: `calc(${MAX_HEIGHT_VH}vh * ${aspect})`,
        }}
      >
        {!resolved && (
          <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm">
            Загружаем видео…
          </div>
        )}

        {resolved && youtubeId && !started && (
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="absolute inset-0 w-full h-full group"
            aria-label="Смотреть урок"
          >
            {poster && (
              <img
                src={poster}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <span className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/95 shadow-lg transition-transform group-hover:scale-105 group-active:scale-95">
                <Play className="w-7 h-7 md:w-9 md:h-9 text-dark-900 fill-dark-900 ml-1" />
              </span>
            </span>
          </button>
        )}

        {resolved && youtubeId && started && (
          <YoutubePlayer
            videoId={youtubeId}
            startAt={startAt}
            autoplay
            onProgress={persistTime}
            onEnded={onEnded}
          />
        )}

        {resolved && !youtubeId && (
          <video
            ref={videoRef}
            src={(source as { kind: 'file'; src: string }).src}
            controls
            controlsList="nodownload"
            className="w-full h-full"
            onTimeUpdate={handleTimeUpdate}
            onEnded={onEnded}
            onLoadedMetadata={handleLoadedMetadata}
            playsInline
          />
        )}

        {resolved && !youtubeId && (
          <div className="absolute bottom-14 md:bottom-16 right-2 md:right-4 z-10">
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-3 py-1.5 md:px-4 md:py-2 bg-black/70 hover:bg-black/80 text-white rounded-lg text-sm md:text-base font-medium transition-all backdrop-blur-sm touch-target"
              >
                {speed}x
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg overflow-hidden backdrop-blur-sm animate-scale-in">
                  {speeds.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSpeedChange(s)}
                      className={`block w-full px-4 py-2 text-sm md:text-base text-left transition-colors touch-target ${
                        speed === s ? 'bg-primary-500 text-white' : 'text-white hover:bg-white/10'
                      }`}
                    >
                      {s}x {s === 1 && '(Обычная)'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
