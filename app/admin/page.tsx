import { getSession } from '@/lib/auth/actions';
import Link from 'next/link';
import { BookOpen, Users, Plus, ArrowRight } from 'lucide-react';
import { coursesData } from '@/lib/courseData';

export default async function AdminDashboard() {
  const session = await getSession();
  
  // Краткая статистика
  const totalCourses = coursesData.length;
  const totalStudents = 0; // TODO: Когда будет backend
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Добро пожаловать, {session?.name}!
        </h1>
        <p className="text-gray-600 mt-1">
          Управление академией маникюра
        </p>
      </div>
      
      {/* Stats Cards - Краткая сводка */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{totalCourses}</p>
              <p className="text-sm text-gray-600">Курсов в системе</p>
            </div>
          </div>
          <Link
            href="/admin/courses"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
          >
            Управление курсами
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{totalStudents}</p>
              <p className="text-sm text-gray-600">Студентов</p>
            </div>
          </div>
          <Link
            href="/admin/students"
            className="text-sm text-orange-600 hover:text-orange-700 font-medium inline-flex items-center gap-1"
          >
            Управление студентами
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Быстрые действия</h2>
        
        <div className="grid gap-3 md:grid-cols-2">
          <Link
            href="/admin/courses"
            className="flex items-center gap-4 p-4 bg-primary-50 hover:bg-primary-100 active:bg-primary-100 rounded-lg transition-colors touch-manipulation"
          >
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Все курсы</p>
              <p className="text-sm text-gray-600">Управление всеми курсами</p>
            </div>
          </Link>
          
          <Link
            href="/admin/courses/create"
            className="flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 active:bg-blue-100 rounded-lg transition-colors touch-manipulation"
          >
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Создать курс</p>
              <p className="text-sm text-gray-600">Добавить новый курс</p>
            </div>
          </Link>
        </div>
      </div>
      
      {/* Recent Courses Preview - Превью последних курсов */}
      {coursesData.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Последние курсы</h2>
            <Link
              href="/admin/courses"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
            >
              Смотреть все
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="space-y-3">
            {coursesData.slice(0, 3).map((course) => (
              <Link
                key={course.id}
                href={`/admin/courses/${course.id}`}
                className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 active:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-primary-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{course.title}</p>
                  <p className="text-sm text-gray-600">
                    {course.modules.length} модулей
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
