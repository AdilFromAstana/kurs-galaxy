'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Логируем в консоль / в реальном проде сюда подключить Sentry/Rollbar
    console.error('App error boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 md:p-10 text-center border border-red-100">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-12 h-12 text-red-600" />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-dark-900 mb-3">
          Что-то пошло не так
        </h1>
        <p className="text-dark-600 mb-2">
          Произошла непредвиденная ошибка. Мы уже знаем о ней и работаем над
          решением.
        </p>
        {error.digest && (
          <p className="text-xs text-dark-400 mb-6 font-mono">
            ID ошибки: {error.digest}
          </p>
        )}
        {!error.digest && <div className="mb-6" />}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Попробовать снова
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-dark-700 hover:bg-gray-50 rounded-xl font-semibold transition-colors"
          >
            <Home className="w-5 h-5" />
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}
