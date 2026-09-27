'use client';

import { CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import LessonPhotoGrid from '@/components/lesson/LessonPhotoGrid';

// Блоки страницы урока. Общие для страницы ученицы и предпросмотра в админке —
// чтобы превью показывало ровно то же, что видит ученица.

export function LessonTitle({
  title,
  duration,
  cover,
  completed = false,
}: {
  title: string;
  duration: string;
  cover: string | null;
  completed?: boolean;
}) {
  return (
    <div className="animate-slide-up">
      <div className="flex items-start gap-4 mb-3">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl object-cover bg-gray-100 shadow-soft"
          />
        )}
        <h1 className="flex-1 min-w-0 text-2xl md:text-3xl lg:text-4xl">{title}</h1>
        {completed && (
          <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span className="hidden sm:inline">Завершено</span>
          </div>
        )}
      </div>
      <p className="text-base md:text-lg text-dark-600">Длительность: {duration}</p>
    </div>
  );
}

/** Конспект урока — скрыт, если текст не заполнен. */
export function LessonContentCard({ content }: { content: string | null | undefined }) {
  if (!content?.trim()) return null;
  return (
    <div className="card animate-slide-up">
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Конспект урока</h2>
      <div className="lesson-content prose prose-lg max-w-none prose-headings:text-dark-900 prose-a:text-primary-600 hover:prose-a:text-primary-700 prose-img:rounded-xl prose-img:shadow-md prose-blockquote:border-primary-500 prose-blockquote:bg-primary-50/50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-code:text-primary-700 prose-code:bg-primary-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children, ...props }) => (
              <a
                href={href}
                target={href?.startsWith('http') ? '_blank' : undefined}
                rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                {...props}
              >
                {children}
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

/** Фото урока — скрыт, если фото нет. */
export function LessonPhotosCard({
  photos,
}: {
  photos: { id: string; url: string; caption?: string | null }[];
}) {
  if (photos.length === 0) return null;
  return (
    <div className="card animate-slide-up">
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Фото урока</h2>
      <LessonPhotoGrid photos={photos} />
    </div>
  );
}
