import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary-50 via-white to-primary-100">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 md:p-10 text-center border border-gray-100">
        {/* Большая 404 */}
        <div className="text-7xl md:text-8xl font-black text-primary-600 leading-none mb-4">
          404
        </div>

        <div className="w-16 h-1 bg-primary-600 rounded-full mx-auto mb-6" />

        <h1 className="text-2xl md:text-3xl font-bold text-dark-900 mb-3">
          Страница не найдена
        </h1>
        <p className="text-dark-600 mb-8">
          Возможно, вы перешли по устаревшей ссылке или страница была удалена.
          Попробуйте начать с главной.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-colors"
          >
            <Home className="w-5 h-5" />
            На главную
          </Link>
          <Link
            href="/courses"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-dark-700 hover:bg-gray-50 rounded-xl font-semibold transition-colors"
          >
            <Search className="w-5 h-5" />
            Каталог курсов
          </Link>
        </div>
      </div>
    </div>
  );
}
