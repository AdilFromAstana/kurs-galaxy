'use client';

import { BookOpen, Plus, Layers, Video, DollarSign, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { confirmToast } from '@/lib/toastConfirm';

type AdminCourse = {
  id: string;
  slug: string;
  title: string;
  description: string;
  published: boolean;
  modules: { id: string; lessons: { id: string }[] }[];
  pricingPlans: { id: string; price: number; currency: string }[];
  creator?: { id: string; name: string; email: string } | null;
};

export default function CoursesListPage() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/admin/courses', { credentials: 'include' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCourses(data.courses ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleDeleteCourse = async (courseId: string) => {
    const ok = await confirmToast({
      message: 'Удалить курс? Все разделы и уроки тоже удалятся. Действие необратимо.',
      confirmText: 'Удалить',
      destructive: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/courses/${courseId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      toast.success('Курс удалён');
    } else {
      toast.error('Не удалось удалить курс');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary-600" />
            Управление курсами
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Все курсы в системе
          </p>
        </div>
        <Link
          href="/admin/courses/create"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 rounded-lg font-medium"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden md:inline">Создать курс</span>
          <span className="md:hidden">Создать</span>
        </Link>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-3.5 shadow-soft flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900 leading-none mb-1">{courses.length}</div>
            <div className="text-[11px] font-medium text-gray-400">Курсов</div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-3.5 shadow-soft flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900 leading-none mb-1">
              {courses.reduce((sum, course) => sum + course.modules.length, 0)}
            </div>
            <div className="text-[11px] font-medium text-gray-400">Разделов</div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-3.5 shadow-soft flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900 leading-none mb-1">
              {courses.reduce(
                (sum, course) =>
                  sum + course.modules.reduce((mSum, module) => mSum + module.lessons.length, 0),
                0
              )}
            </div>
            <div className="text-[11px] font-medium text-gray-400">Уроков</div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-3.5 shadow-soft flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900 leading-none mb-1">
              {courses.reduce((sum, course) => sum + (course.pricingPlans?.length || 0), 0)}
            </div>
            <div className="text-[11px] font-medium text-gray-400">Тарифов</div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-soft text-gray-500">
          Загрузка...
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium mb-3">Не удалось загрузить курсы</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium"
          >
            Повторить
          </button>
        </div>
      )}

      {/* Список курсов */}
      <div className="space-y-4">
        {courses.map((course) => {
          const totalModules = course.modules.length;
          const totalLessons = course.modules.reduce(
            (sum, module) => sum + module.lessons.length,
            0
          );

          return (
            <div
              key={course.id}
              className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100 hover:border-primary-200 transition-colors"
            >
              {/* Иконка + бейдж + заголовок */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-7 h-7 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  {!course.published && (
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full mb-1">
                      Черновик
                    </span>
                  )}
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">{course.title}</h2>
                  {course.creator && (
                    <p className="text-primary-600 text-xs font-semibold mt-1">
                      Автор: {course.creator.name}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-2">
                {course.description}
              </p>

              {/* Метрики */}
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 rounded-lg text-xs font-semibold text-gray-900">
                  <DollarSign className="w-3.5 h-3.5 text-primary-600" />
                  {course.pricingPlans && course.pricingPlans.length > 0 ? (
                    <>
                      от {Math.min(...course.pricingPlans.map(p => p.price)).toLocaleString()} {course.pricingPlans[0].currency}
                    </>
                  ) : (
                    <span className="text-gray-400 font-normal">Не указана</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg text-xs font-semibold text-gray-700">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  {totalModules} {totalModules === 1 ? 'раздел' : 'разделов'}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-lg text-xs font-semibold text-gray-700">
                  <Video className="w-3.5 h-3.5 text-green-600" />
                  {totalLessons} {totalLessons === 1 ? 'урок' : 'уроков'}
                </div>
              </div>

              {/* Действия */}
              <div className="grid grid-cols-1 gap-2">
                <Link
                  href={`/admin/courses/${course.id}`}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 rounded-xl font-bold text-sm transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Открыть курс
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/admin/courses/${course.id}/edit`}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded-xl font-semibold text-sm transition-colors"
                  >
                    <Edit className="w-4 h-4 text-gray-500" />
                    Редактировать
                  </Link>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-red-100 text-red-600 hover:bg-red-50 active:bg-red-100 rounded-xl font-semibold text-sm transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {courses.length === 0 && !loading && !error && (
          <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Нет курсов</h3>
            <p className="text-gray-600 mb-6">Создайте свой первый курс</p>
            <Link
              href="/admin/courses/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 rounded-lg font-medium"
            >
              <Plus className="w-5 h-5" />
              Создать курс
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
