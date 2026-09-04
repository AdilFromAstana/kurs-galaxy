'use client';

import {
  BookOpen,
  ArrowLeft,
  Plus,
  Layers,
  Video,
  DollarSign,
  Edit,
  Download,
  Eye,
  EyeOff,
  ChevronRight,
  Play,
  Clock,
  Users,
  Wallet,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const ACCESS_LABEL: Record<string, string> = {
  ONE_MONTH: '1 месяц',
  TWO_MONTHS: '2 месяца',
  THREE_MONTHS: '3 месяца',
  SIX_MONTHS: '6 месяцев',
  TWELVE_MONTHS: '12 месяцев',
  UNLIMITED: 'Бессрочный',
};

const TABS = [
  { id: 'info', label: 'Инфо' },
  { id: 'sections', label: 'Разделы' },
  { id: 'pricing', label: 'Тарифы' },
  { id: 'analytics', label: 'Аналитика' },
] as const;

type TabId = (typeof TABS)[number]['id'];

type AdminCourse = {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  published: boolean;
  pricingPlans: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number;
    currency: string;
    isActive: boolean;
    isRecommended: boolean;
    accessPeriod: string;
  }>;
  modules: Array<{
    id: string;
    title: string;
    description: string;
    lessons: Array<{ id: string; title: string; duration: string; isFree: boolean }>;
  }>;
  creator?: { id: string; name: string; email: string } | null;
};

type Analytics = {
  revenue: number;
  students: number;
  completionRate: number;
};

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const [course, setCourse] = useState<AdminCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('info');
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const res = await fetch(`/api/admin/courses/${courseId}`, { credentials: 'include' });
      if (!cancel) {
        if (res.ok) {
          const data = await res.json();
          setCourse(data.course);
          setActiveModuleId(data.course.modules[0]?.id ?? null);
        }
        setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [courseId]);

  useEffect(() => {
    if (activeTab !== 'analytics' || analytics) return;
    let cancel = false;
    setAnalyticsLoading(true);
    (async () => {
      const res = await fetch(`/api/admin/courses/${courseId}/analytics`, { credentials: 'include' });
      if (cancel) return;
      if (res.ok) setAnalytics(await res.json());
      setAnalyticsLoading(false);
    })();
    return () => {
      cancel = true;
    };
  }, [activeTab, analytics, courseId]);

  const handleTogglePublish = async () => {
    if (!course) return;
    const next = !course.published;
    const res = await fetch(`/api/admin/courses/${course.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: next }),
    });
    if (!res.ok) {
      toast.error('Не удалось изменить статус публикации');
      return;
    }
    setCourse((prev) => (prev ? { ...prev, published: next } : prev));
    toast.success(
      next ? 'Курс опубликован, виден в каталоге' : 'Курс снят с публикации',
    );
  };

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
      toast.success('Данные курса экспортированы');
    } catch (error) {
      toast.error('Ошибка при экспорте данных');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <BookOpen className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Курс не найден</h2>
        <p className="text-gray-600 mb-6">Курс с ID &quot;{courseId}&quot; не существует</p>
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
  const activeModule = course.modules.find((m) => m.id === activeModuleId) ?? course.modules[0] ?? null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Назад */}
      <Link
        href="/admin/courses"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к курсам
      </Link>

      {/* Tabs */}
      <nav className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab: Инфо */}
      {activeTab === 'info' && (
        <div className="space-y-6">
          {/* Карточка курса */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-soft">
            <div className="flex items-start justify-between mb-5">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                {course.thumbnailUrl ? (
                  <img
                    src={course.thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BookOpen className="w-8 h-8 text-primary-600" />
                )}
              </div>
              <span
                className={`text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full ${
                  course.published
                    ? 'bg-green-50 text-green-700'
                    : 'bg-primary-50 text-primary-700'
                }`}
              >
                {course.published ? 'Опубликован' : 'Черновик'}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-2">
              {course.title}
            </h1>
            {course.creator && (
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-semibold">Автор:</span>{' '}
                <span className="text-primary-700 font-medium">{course.creator.name}</span>
                <span className="text-gray-500"> · {course.creator.email}</span>
              </p>
            )}
            <p className="text-gray-600 mb-6">{course.description}</p>

            {/* Действия */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Link
                href={`/admin/courses/${course.id}/edit`}
                className="flex items-center justify-center gap-2 py-3.5 px-4 border border-primary-200 text-primary-700 rounded-xl font-medium hover:bg-primary-50 active:bg-primary-100 transition-colors"
              >
                <Edit className="w-5 h-5" />
                Редактировать
              </Link>
              <button
                onClick={handleExportCourse}
                className="flex items-center justify-center gap-2 py-3.5 px-4 border border-primary-200 text-primary-700 rounded-xl font-medium hover:bg-primary-50 active:bg-primary-100 transition-colors"
              >
                <Download className="w-5 h-5" />
                Скачать
              </button>
            </div>
            <button
              onClick={handleTogglePublish}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-colors ${
                course.published
                  ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  : 'bg-primary-700 text-white hover:bg-primary-800 shadow-sm'
              }`}
            >
              {course.published ? (
                <>
                  <EyeOff className="w-5 h-5" />
                  Снять с публикации
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5" />
                  Опубликовать
                </>
              )}
            </button>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-3.5 shadow-soft flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900 leading-none mb-1">{totalModules}</div>
                <div className="text-[11px] font-medium text-gray-400">Разделы</div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-3.5 shadow-soft flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900 leading-none mb-1">{totalLessons}</div>
                <div className="text-[11px] font-medium text-gray-400">Всего уроков</div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-3.5 shadow-soft flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900 leading-none mb-1">{freeLessons}</div>
                <div className="text-[11px] font-medium text-gray-400">Бесплатных</div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-3.5 shadow-soft flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900 leading-none mb-1">{paidLessons}</div>
                <div className="text-[11px] font-medium text-gray-400">Платных</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Разделы */}
      {activeTab === 'sections' && (
        <div className="space-y-4">
          {totalModules > 0 && activeModule ? (
            <>
              {/* Переключатель разделов */}
              <div className="flex items-center gap-2">
                <div className="flex-1 flex gap-2 overflow-x-auto pb-1">
                  {course.modules.map((module, index) => (
                    <button
                      key={module.id}
                      onClick={() => setActiveModuleId(module.id)}
                      className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                        module.id === activeModule.id
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {index + 1}. {module.title}
                    </button>
                  ))}
                </div>
                <Link
                  href={`/admin/modules/create?courseId=${course.id}`}
                  aria-label="Создать раздел"
                  title="Создать раздел"
                  className="shrink-0 w-10 h-10 rounded-full bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center shadow-sm transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </Link>
              </div>

              {/* Содержимое активного раздела */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-soft">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h2 className="text-lg font-bold text-gray-900">{activeModule.title}</h2>
                  <Link
                    href={`/admin/modules/${activeModule.id}/edit`}
                    aria-label="Редактировать раздел"
                    title="Редактировать раздел"
                    className="shrink-0 p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                </div>
                <p className="text-sm text-gray-600 mb-4">{activeModule.description}</p>
                <div className="text-xs text-gray-500 mb-3">
                  {activeModule.lessons.length}{' '}
                  {activeModule.lessons.length === 1 ? 'урок' : 'уроков'}
                </div>

                {activeModule.lessons.length > 0 ? (
                  <div className="space-y-2">
                    {activeModule.lessons.map((lesson) => (
                      <Link
                        key={lesson.id}
                        href={`/admin/lessons/${lesson.id}/edit`}
                        className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-primary-200 transition-colors"
                      >
                        <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0 text-primary-600">
                          <Play className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{lesson.title}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {lesson.duration}
                            {lesson.isFree && (
                              <span className="ml-1.5 text-green-600 font-medium">Бесплатно</span>
                            )}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    href={`/admin/lessons/create?courseId=${course.id}&moduleId=${activeModule.id}`}
                    className="flex flex-col items-center justify-center gap-2 py-8 text-center border-2 border-dashed border-gray-200 rounded-xl text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-colors"
                  >
                    <Plus className="w-6 h-6" />
                    <span className="text-sm font-medium">Добавить первый урок</span>
                  </Link>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <Layers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Нет разделов</h4>
              <p className="text-gray-600 mb-4">Создайте первый раздел для этого курса</p>
              <Link
                href={`/admin/modules/create?courseId=${course.id}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 rounded-lg font-medium"
              >
                <Plus className="w-5 h-5" />
                Создать раздел
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Tab: Тарифы */}
      {activeTab === 'pricing' && (
        <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
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
                <div key={plan.id} className="bg-white border border-gray-100 rounded-2xl shadow-soft p-4 hover:border-primary-200 transition-colors">
                  {plan.isRecommended && (
                    <span className="inline-block bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded mb-2">
                      Рекомендуется
                    </span>
                  )}
                  <h4 className="font-bold text-lg mb-1">{plan.name}</h4>
                  <p className="text-2xl font-bold text-primary-600 mb-1">
                    {plan.price.toLocaleString()} {plan.currency}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    Доступ: {ACCESS_LABEL[plan.accessPeriod] ?? plan.accessPeriod}
                  </p>
                  {plan.description && (
                    <p className="text-sm text-gray-500 mb-3">{plan.description}</p>
                  )}
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      plan.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
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
      )}

      {/* Tab: Аналитика */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          {analyticsLoading || !analytics ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-soft text-gray-500">
              Загрузка...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-soft">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-3">
                  <Wallet className="w-5 h-5" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {analytics.revenue.toLocaleString()} ₸
                </div>
                <div className="text-sm text-gray-500 mt-1">Выручка курса</div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-soft">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{analytics.students}</div>
                <div className="text-sm text-gray-500 mt-1">Студентов купили</div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-soft">
                <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{analytics.completionRate}%</div>
                <div className="text-sm text-gray-500 mt-1">Средняя завершаемость</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
