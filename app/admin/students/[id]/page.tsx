'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Calendar,
  ShoppingBag,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  Infinity,
  CalendarPlus,
  Ban,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { confirmToast } from '@/lib/toastConfirm';

const ACCESS_LABEL: Record<string, string> = {
  ONE_MONTH: '1 месяц',
  TWO_MONTHS: '2 месяца',
  THREE_MONTHS: '3 месяца',
  SIX_MONTHS: '6 месяцев',
  TWELVE_MONTHS: '12 месяцев',
  UNLIMITED: 'Бессрочный',
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Активна',
  EXPIRED: 'Истекла',
  CANCELLED: 'Отменена',
};

type StudentDTO = {
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: string;
  };
  purchases: Array<{
    id: string;
    status: string;
    purchasedAt: string;
    expiresAt: string | null;
    paymentAmount: number;
    paymentCurrency: string;
    paymentMethod: string | null;
    plan: {
      id: string;
      name: string;
      accessPeriod: string;
    };
    course: { id: string; slug: string; title: string };
  }>;
  progressByCourse: Array<{
    courseId: string;
    courseTitle: string;
    completed: number;
    total: number;
  }>;
};

type CoursePlan = {
  id: string;
  title: string;
  pricingPlans: Array<{
    id: string;
    name: string;
    price: number;
    currency: string;
    accessPeriod: string;
    isActive: boolean;
  }>;
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function getEffectiveStatus(p: StudentDTO['purchases'][0]): string {
  // Если статус ACTIVE но expiresAt в прошлом — фактически истёк
  if (p.status === 'ACTIVE' && p.expiresAt) {
    if (new Date(p.expiresAt).getTime() < Date.now()) return 'EXPIRED';
  }
  return p.status;
}

export default function StudentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<StudentDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [coursesAvail, setCoursesAvail] = useState<CoursePlan[]>([]);
  const [showGrant, setShowGrant] = useState(false);
  const [grantPlanId, setGrantPlanId] = useState('');
  const [grantBusy, setGrantBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/students/${id}`, {
      credentials: 'include',
    });
    if (res.ok) {
      setData(await res.json());
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Подгружаем все курсы (включая черновики, для админа), чтобы выбрать план для выдачи
  useEffect(() => {
    let cancel = false;
    (async () => {
      const res = await fetch('/api/admin/courses', {
        credentials: 'include',
      });
      if (!cancel && res.ok) {
        const d = await res.json();
        setCoursesAvail(d.courses ?? []);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const handleGrant = async () => {
    if (!grantPlanId) {
      toast.error('Выберите тариф');
      return;
    }
    setGrantBusy(true);
    const res = await fetch('/api/admin/purchases', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: id, planId: grantPlanId }),
    });
    setGrantBusy(false);
    const r = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(r.message ?? 'Не удалось выдать доступ');
      return;
    }
    toast.success('Доступ выдан');
    setShowGrant(false);
    setGrantPlanId('');
    await refresh();
  };

  const handleExtend = async (purchaseId: string, days: number) => {
    const res = await fetch(`/api/admin/purchases/${purchaseId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ extendDays: days }),
    });
    if (res.ok) {
      toast.success(`Продлено на ${days} дн.`);
      await refresh();
    } else {
      toast.error('Не удалось продлить');
    }
  };

  const handleMakeUnlimited = async (purchaseId: string) => {
    const ok = await confirmToast({
      message: 'Сделать доступ бессрочным?',
      confirmText: 'Сделать',
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/purchases/${purchaseId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ makeUnlimited: true }),
    });
    if (res.ok) {
      toast.success('Доступ безлимитный');
      await refresh();
    } else {
      toast.error('Не удалось');
    }
  };

  const handleCancel = async (purchaseId: string) => {
    const ok = await confirmToast({
      message:
        'Отменить эту покупку? Студент потеряет доступ. Запись останется в истории для отчётов.',
      confirmText: 'Отменить покупку',
      destructive: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/purchases/${purchaseId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      toast.success('Покупка отменена');
      await refresh();
    } else {
      toast.error('Не удалось отменить');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Студент не найден</p>
        <Link
          href="/admin/students"
          className="text-primary-600 hover:underline"
        >
          К списку студентов
        </Link>
      </div>
    );
  }

  const totalPaid = data.purchases
    .filter((p) => getEffectiveStatus(p) === 'ACTIVE' || p.status === 'ACTIVE')
    .reduce((s, p) => s + p.paymentAmount, 0);
  const activeCount = data.purchases.filter(
    (p) => getEffectiveStatus(p) === 'ACTIVE',
  ).length;

  // План выдачи: показываем активные планы из любого курса, у которого ещё нет активной покупки
  const purchasedActive = new Set(
    data.purchases
      .filter((p) => getEffectiveStatus(p) === 'ACTIVE')
      .map((p) => p.course.id),
  );
  const grantableCourses = coursesAvail
    .map((c) => ({
      ...c,
      pricingPlans: (c.pricingPlans ?? []).filter((p) => p.isActive),
    }))
    .filter((c) => c.pricingPlans.length > 0);

  return (
    <div className="space-y-6 animate-fade-in pb-8 max-w-6xl">
      {/* Хлебные крошки */}
      <Link
        href="/admin/students"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        К списку студентов
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-gray-100">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-2xl flex-shrink-0">
            {data.user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {data.user.name}
            </h1>
            <div className="flex items-center gap-2 text-gray-600 mt-1 text-sm">
              <Mail className="w-4 h-4" />
              <span>{data.user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 mt-1 text-xs">
              <Calendar className="w-3.5 h-3.5" />
              <span>Зарегистрирован: {formatDate(data.user.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Сводные статы */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-5">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              Активных покупок
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {activeCount}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              Заплачено
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {totalPaid.toLocaleString()} ₸
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              Курсов в прогрессе
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {data.progressByCourse.length}
            </div>
          </div>
        </div>
      </div>

      {/* Выдача доступа */}
      <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Выдать доступ вручную
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Например, после оплаты на Каспи или для подарка / промо
            </p>
          </div>
          {!showGrant && (
            <button
              onClick={() => setShowGrant(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Выдать
            </button>
          )}
        </div>

        {showGrant && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 space-y-3">
            <select
              value={grantPlanId}
              onChange={(e) => setGrantPlanId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white"
            >
              <option value="">Выберите курс и тариф...</option>
              {grantableCourses.map((c) => (
                <optgroup key={c.id} label={c.title}>
                  {c.pricingPlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} —{' '}
                      {ACCESS_LABEL[p.accessPeriod] ?? p.accessPeriod} —{' '}
                      {p.price.toLocaleString()} {p.currency}
                      {purchasedActive.has(c.id) ? ' (уже куплен)' : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleGrant}
                disabled={grantBusy || !grantPlanId}
                className="flex-1 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-medium disabled:opacity-50"
              >
                {grantBusy ? 'Выдача...' : 'Выдать доступ'}
              </button>
              <button
                onClick={() => {
                  setShowGrant(false);
                  setGrantPlanId('');
                }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Покупки */}
      <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-primary-600" />
          Покупки ({data.purchases.length})
        </h2>

        {data.purchases.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            Покупок пока нет
          </p>
        ) : (
          <div className="space-y-3">
            {data.purchases.map((p) => {
              const eff = getEffectiveStatus(p);
              const days = daysUntil(p.expiresAt);
              return (
                <div
                  key={p.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {p.course.title}
                        </h3>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            eff === 'ACTIVE'
                              ? 'bg-green-100 text-green-700'
                              : eff === 'EXPIRED'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {STATUS_LABEL[eff] ?? eff}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {p.plan.name} —{' '}
                        {ACCESS_LABEL[p.plan.accessPeriod] ??
                          p.plan.accessPeriod}
                      </p>
                      <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                        <div>
                          Куплено: {formatDate(p.purchasedAt)} ·{' '}
                          {p.paymentAmount.toLocaleString()}{' '}
                          {p.paymentCurrency}
                          {p.paymentMethod === 'admin_manual' && (
                            <span className="ml-2 text-amber-600 font-medium">
                              (выдано вручную)
                            </span>
                          )}
                          {p.paymentMethod === 'mock' && (
                            <span className="ml-2 text-blue-600 font-medium">
                              (демо-режим)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {p.expiresAt ? (
                            <>
                              Доступ до: {formatDate(p.expiresAt)}
                              {days !== null && days >= 0 && (
                                <span
                                  className={`ml-1 ${days <= 7 ? 'text-red-600 font-medium' : ''}`}
                                >
                                  (осталось {days} дн.)
                                </span>
                              )}
                              {days !== null && days < 0 && (
                                <span className="ml-1 text-red-600 font-medium">
                                  (истёк)
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-green-600 font-medium">
                              Безлимитный доступ
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Действия */}
                  {eff !== 'CANCELLED' && (
                    <div className="flex items-center gap-2 flex-wrap mt-3">
                      <button
                        onClick={() => handleExtend(p.id, 30)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-xs font-medium text-gray-700"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                        +30 дней
                      </button>
                      <button
                        onClick={() => handleExtend(p.id, 90)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-xs font-medium text-gray-700"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                        +90 дней
                      </button>
                      {p.expiresAt && (
                        <button
                          onClick={() => handleMakeUnlimited(p.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-xs font-medium text-gray-700"
                        >
                          <Infinity className="w-3.5 h-3.5" />
                          Безлимит
                        </button>
                      )}
                      <button
                        onClick={() => handleCancel(p.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 hover:bg-red-50 rounded-lg text-xs font-medium text-red-600 ml-auto"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        Отменить
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Прогресс по курсам */}
      <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          Прогресс по курсам
        </h2>

        {data.progressByCourse.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            Студент ещё не начинал ни одного курса
          </p>
        ) : (
          <div className="space-y-3">
            {data.progressByCourse.map((c) => {
              const percent =
                c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0;
              return (
                <div key={c.courseId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="font-medium text-gray-900">
                      {c.courseTitle}
                    </h3>
                    <span
                      className={`text-sm font-semibold ${
                        percent === 100
                          ? 'text-green-600'
                          : 'text-primary-600'
                      }`}
                    >
                      {percent}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {c.completed} из {c.total} уроков
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percent === 100 ? 'bg-green-500' : 'bg-primary-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
