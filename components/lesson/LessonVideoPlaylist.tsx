'use client';

import { useState } from 'react';
import { Play, CheckCircle2, SkipForward } from 'lucide-react';
import VideoPlayer from '@/components/lesson/VideoPlayer';
import type { CourseVideo } from '@/components/providers/CoursesProvider';

interface Props {
  lessonId: string;
  videos: CourseVideo[];
  /** Легаси-урок с одиночным videoUrl и без строк LessonVideo. */
  legacyVideoUrl?: string;
}

export default function LessonVideoPlaylist({
  lessonId,
  videos,
  legacyVideoUrl,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [watched, setWatched] = useState<Set<string>>(new Set());

  if (videos.length === 0) {
    return <VideoPlayer lessonId={lessonId} videoUrl={legacyVideoUrl} />;
  }

  const active = videos[Math.min(activeIndex, videos.length - 1)];
  const next = activeIndex < videos.length - 1 ? videos[activeIndex + 1] : null;

  const titleOf = (v: CourseVideo, i: number) => v.title || `Видео ${i + 1}`;

  const handleEnded = () => {
    setWatched((prev) => new Set(prev).add(active.id));
    if (next) setActiveIndex(activeIndex + 1);
  };

  return (
    <div className="space-y-4">
      <VideoPlayer
        lessonId={lessonId}
        videoId={active.id}
        onEnded={handleEnded}
      />

      {videos.length > 1 && (
        <>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm md:text-base font-semibold text-dark-900">
              {titleOf(active, activeIndex)}
              <span className="ml-2 text-sm font-normal text-dark-500">
                {activeIndex + 1} из {videos.length}
              </span>
            </p>
            {next && (
              <button
                onClick={() => setActiveIndex(activeIndex + 1)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
              >
                <SkipForward className="w-4 h-4" />
                <span className="truncate max-w-[200px]">
                  Следующий: {titleOf(next, activeIndex + 1)}
                </span>
              </button>
            )}
          </div>

          <div className="card !p-3">
            <div className="space-y-1">
              {videos.map((v, i) => {
                const isCurrent = i === activeIndex;
                const isWatched = watched.has(v.id);
                return (
                  <button
                    key={v.id}
                    onClick={() => setActiveIndex(i)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${
                      isCurrent
                        ? 'bg-primary-50 ring-1 ring-primary-300'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center ${
                        isCurrent
                          ? 'bg-primary-600'
                          : isWatched
                            ? 'bg-green-100'
                            : 'bg-primary-100'
                      }`}
                    >
                      {isWatched && !isCurrent ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Play
                          className={`w-3.5 h-3.5 ${
                            isCurrent ? 'text-white' : 'text-primary-600'
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium line-clamp-2 ${
                          isCurrent ? 'text-primary-700' : 'text-dark-900'
                        }`}
                      >
                        {titleOf(v, i)}
                      </p>
                      {v.duration && (
                        <p className="text-xs text-dark-500 mt-0.5">
                          {v.duration}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
