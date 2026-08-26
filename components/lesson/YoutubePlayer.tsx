'use client';

import { useEffect, useRef } from 'react';

interface YoutubePlayerProps {
  videoId: string;
  startAt: number;
  autoplay?: boolean;
  onProgress: (time: number) => void;
  onEnded?: () => void;
}

const API_SRC = 'https://www.youtube.com/iframe_api';

let apiPromise: Promise<any> | null = null;

function loadYoutubeApi(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('ssr'));
  const w = window as any;
  if (w.YT?.Player) return Promise.resolve(w.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      if (typeof prev === 'function') prev();
      resolve(w.YT);
    };
    if (!document.querySelector(`script[src="${API_SRC}"]`)) {
      const script = document.createElement('script');
      script.src = API_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  });
  return apiPromise;
}

export default function YoutubePlayer({
  videoId,
  startAt,
  autoplay = false,
  onProgress,
  onEnded,
}: YoutubePlayerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef(onProgress);
  progressRef.current = onProgress;
  const endedRef = useRef(onEnded);
  endedRef.current = onEnded;

  useEffect(() => {
    let cancelled = false;

    loadYoutubeApi()
      .then((YT) => {
        if (cancelled || !hostRef.current) return;
        playerRef.current = new YT.Player(hostRef.current, {
          videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: autoplay ? 1 : 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            cc_load_policy: 0,
            iv_load_policy: 3,
            color: 'white',
            start: Math.floor(startAt),
          },
          events: {
            onReady: (event: any) => {
              try {
                event.target.unloadModule?.('captions');
                event.target.unloadModule?.('cc');
              } catch {
                /* ignore */
              }
              if (autoplay) event.target.playVideo?.();
            },
            onStateChange: (event: any) => {
              const player = playerRef.current;
              if (!player) return;
              if (event.data === YT.PlayerState.PLAYING) {
                if (tickRef.current) clearInterval(tickRef.current);
                tickRef.current = setInterval(() => {
                  const time = player.getCurrentTime?.();
                  if (typeof time === 'number') progressRef.current(time);
                }, 5000);
              } else {
                if (tickRef.current) {
                  clearInterval(tickRef.current);
                  tickRef.current = null;
                }
                const time = player.getCurrentTime?.();
                if (typeof time === 'number') progressRef.current(time);
              }
              if (event.data === YT.PlayerState.ENDED) endedRef.current?.();
            },
          },
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (tickRef.current) clearInterval(tickRef.current);
      const player = playerRef.current;
      playerRef.current = null;
      if (player?.destroy) {
        try {
          player.destroy();
        } catch {
          /* ignore */
        }
      }
    };
  }, [videoId, startAt, autoplay]);

  return (
    <div className="absolute inset-0 [&>iframe]:absolute [&>iframe]:inset-0 [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0">
      <div ref={hostRef} />
    </div>
  );
}
