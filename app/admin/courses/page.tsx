'use client';

import { BookOpen, Plus, Layers, Video, DollarSign, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { coursesData } from '@/lib/courseData';
import { useState } from 'react';

export default function CoursesListPage() {
  const [courses, setCourses] = useState(coursesData);

  const handleDeleteCourse = (courseId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот курс? Все модули и уроки будут удалены.')) {
      // TODO: Реализовать удаление через localStorage
      console.log('Удаление курса:', courseId);
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-600" />
            </div>
            <p className="text-sm text-gray-600">Курсов</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{courses.length}</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600">Модулей</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {courses.reduce((sum, course) => sum + course.modules.length, 0)}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-600">Уроков</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {courses.reduce(
              (sum, course) =>
                sum + course.modules.reduce((mSum, module) => mSum + module.lessons.length, 0),
              0
            )}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-sm text-gray-600">Тарифов</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {courses.reduce((sum, course) => sum + (course.pricingPlans?.length || 0), 0)}
          </p>
        </div>
      </div>

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
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-primary-200 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Иконка курса */}
                <div className="w-16 h-16 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-8 h-8 text-primary-600" />
                </div>

                {/* Информация о курсе */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h2>
                  <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>

                  {/* Метрики */}
                  <div className="flex items-center gap-3 flex-wrap mb-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 rounded-lg">
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
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-700">
                        {totalModules} {totalModules === 1 ? 'модуль' : 'модулей'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
                      <Video className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-gray-700">
                        {totalLessons} {totalLessons === 1 ? 'урок' : 'уроков'}
                      </span>
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <Link
                      href={`/admin/courses/${course.id}`}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 rounded-lg font-medium text-sm"
                    >
                      <BookOpen className="w-4 h-4" />
                      Открыть
                    </Link>
                    <Link
                      href={`/admin/courses/${course.id}/edit`}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded-lg font-medium text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Редактировать
                    </Link>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-red-300 text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg font-medium text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {courses.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-200">
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
