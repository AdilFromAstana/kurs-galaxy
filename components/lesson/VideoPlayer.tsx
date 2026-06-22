'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface VideoPlayerProps {
  lessonId: string;
  /** Оставлен для обратной совместимости — реально не используется,
   *  плеер всегда ходит через защищённый эндпоинт. */
  videoUrl?: string;
}

export default function VideoPlayer({ lessonId }: VideoPlayerProps) {
  // Видео отдаётся защищённым стрим-эндпоинтом с проверкой авторизации.
  // Внешние URL (если такие были сохранены) сервер прозрачно редиректит.
  const streamSrc = `/api/lessons/${lessonId}/video`;

  const { isAuthenticated } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  useEffect(() => {
    // Гостям video-position не сохраняется — пропускаем загрузку
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/video-position?lessonId=${encodeURIComponent(lessonId)}`, {
          credentials: 'include',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && videoRef.current && data.time) {
          videoRef.current.currentTime = data.time;
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lessonId, isAuthenticated]);

  const persistTime = (time: number) => {
    if (!isAuthenticated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch('/api/video-position', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, time }),
      }).catch(() => {});
    }, 1500);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) persistTime(videoRef.current.currentTime);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (videoRef.current) videoRef.current.playbackRate = newSpeed;
    setShowSpeedMenu(false);
  };

  return (
    <div className="relative w-full">
      <div className="relative w-full aspect-video bg-black rounded-lg md:rounded-2xl overflow-hidden shadow-2xl">
        <video
          ref={videoRef}
          src={streamSrc}
          controls
          controlsList="nodownload"
          className="w-full h-full"
          onTimeUpdate={handleTimeUpdate}
          playsInline
        />

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
      </div>

      <div className="mt-2 text-xs md:text-sm text-dark-500 text-center">
        💡 Видео сохраняет позицию автоматически
      </div>
    </div>
  );
}
