'use client';

import { BookOpen, ArrowLeft, Plus, Layers, Video, DollarSign, Edit, Download } from 'lucide-react';
import Link from 'next/link';
import { getCourseById } from '@/lib/courseData';
import { useParams } from 'next/navigation';

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const course = getCourseById(courseId);

  const handleExportCourse = () => {
    if (!course) return;
    
    try {
      const dataStr = JSON.stringify(course, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `course-${course.id}-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      alert('✅ Данные курса экспортированы!');
    } catch (error) {
      alert('Ошибка при экспорте данных');
      console.error(error);
    }
  };

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <BookOpen className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Курс не найден</h2>
        <p className="text-gray-600 mb-6">Курс с ID "{courseId}" не существует</p>
        <Link
          href="/admin/courses"
          className="px-6 py-3 bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 rounded-lg font-medium"
        >
          К списку курсов
        </Link>
      </div>
    );
  }

  const totalModules = course.modules.length;
  const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
  const freeLessons = course.modules.reduce(
    (sum, module) => sum + module.lessons.filter((l) => l.isFree).length,
    0
  );
  const paidLessons = totalLessons - freeLessons;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/courses"
          className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary-600" />
            {course.title}
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">Управление курсом</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/courses/${course.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded-lg font-medium"
          >
            <Edit className="w-4 h-4" />
            <span className="hidden md:inline">Редактировать</span>
          </Link>
          <button
            onClick={handleExportCourse}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100 rounded-lg font-medium"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Экспорт</span>
          </button>
        </div>
      </div>

      {/* Карточка курса */}
      <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 border border-primary-200">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-8 h-8 text-primary-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{course.title}</h2>
            <p className="text-gray-700 mb-4">{course.description}</p>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg">
                <DollarSign className="w-4 h-4 text-primary-600" />
                <span className="font-semibold text-gray-900">
                  {course.pricingPlans && course.pricingPlans.length > 0 ? (
                    <>
                      от {Math.min(...course.pricingPlans.map(p => p.price)).toLocaleString()} {course.pricingPlans[0].currency}
                    </>
                  ) : (
                    <span className="text-gray-400">Не указана</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg">
                <Layers className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-gray-900">{totalModules} модулей</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg">
                <Video className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-gray-900">{totalLessons} уроков</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary-600" />
            </div>
            <p className="text-sm text-gray-600">Модули</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalModules}</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600">Всего уроков</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalLessons}</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-600">Бесплатных</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{freeLessons}</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-sm text-gray-600">Платных</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{paidLessons}</p>
        </div>
      </div>

      {/* Тарифные планы */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            Тарифные планы ({course.pricingPlans?.length || 0})
          </h3>
          <Link
            href={`/admin/courses/${courseId}/pricing`}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 rounded-lg font-medium text-sm"
          >
            <DollarSign className="w-4 h-4" />
            Управление
          </Link>
        </div>
        
        {course.pricingPlans && course.pricingPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {course.pricingPlans.map(plan => (
              <div key={plan.id} className="border rounded-lg p-4 hover:border-primary-300 transition-colors">
                {plan.isRecommended && (
                  <span className="inline-block bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded mb-2">
                    Рекомендуется
                  </span>
                )}
                <h4 className="font-bold text-lg mb-1">{plan.name}</h4>
                <p className="text-2xl font-bold text-primary-600 mb-1">
                  {plan.price.toLocaleString()} {plan.currency}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Доступ: {plan.accessPeriod.label}
                </p>
                {plan.description && (
                  <p className="text-sm text-gray-500 mb-3">{plan.description}</p>
                )}
                <div className="mt-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    plan.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {plan.isActive ? 'Активен' : 'Неактивен'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p>Тарифные планы не настроены</p>
          </div>
        )}
      </div>

      {/* Модули курса */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Модули курса ({totalModules})</h3>
          <Link
            href={`/admin/modules/create?courseId=${course.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 rounded-lg font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Создать модуль
          </Link>
        </div>

        {totalModules > 0 ? (
          <div className="space-y-3">
            {course.modules.map((module, index) => (
              <Link
                key={module.id}
                href={`/admin/modules/${module.id}/edit`}
                className="block p-4 bg-gray-50 hover:bg-gray-100 active:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary-600">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1">{module.title}</h4>
                    <p className="text-sm text-gray-600 truncate">{module.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {module.lessons.length}{' '}
                      {module.lessons.length === 1 ? 'урок' : 'уроков'}
                    </p>
                  </div>
                  <div className="hidden sm:block text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <Layers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Нет модулей</h4>
            <p className="text-gray-600 mb-4">Создайте первый модуль для этого курса</p>
            <Link
              href={`/admin/modules/create?courseId=${course.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 rounded-lg font-medium"
            >
              <Plus className="w-5 h-5" />
              Создать модуль
            </Link>
          </div>
        )}
      </div>

      {/* Быстрые действия */}
      {totalModules > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href={`/admin/modules/create?courseId=${course.id}`}
            className="flex items-center gap-4 p-5 bg-white border-2 border-primary-200 hover:border-primary-300 active:border-primary-400 rounded-xl transition-colors"
          >
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Создать модуль</h3>
              <p className="text-sm text-gray-600">Добавить новый раздел в курс</p>
            </div>
          </Link>

          <Link
            href={`/admin/courses/${course.id}/edit`}
            className="flex items-center gap-4 p-5 bg-white border-2 border-blue-200 hover:border-blue-300 active:border-blue-400 rounded-xl transition-colors"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Edit className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Редактировать курс</h3>
              <p className="text-sm text-gray-600">Изменить название, описание, цену</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
