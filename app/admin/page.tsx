import { getSession } from '@/lib/auth/actions';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  Plus,
  ArrowRight,
  ChevronRight,
  Layers,
  Video,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Wallet,
} from 'lucide-react';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const session = await getSession();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    totalCourses,
    totalStudents,
    totalLessons,
    totalModules,
    activePurchases,
    recent,
    revenueAgg,
    revenueMonthAgg,
    paidPurchases,
  ] = await Promise.all([
    prisma.course.count(),
    prisma.user.count(),
    prisma.lesson.count(),
    prisma.module.count(),
    prisma.purchase.count({ where: { status: 'ACTIVE' } }),
    prisma.course.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { modules: true } } },
    }),
    // Все успешные покупки с реальной оплатой (без admin_manual)
    prisma.purchase.aggregate({
      where: {
        paymentStatus: 'COMPLETED',
        paymentMethod: { notIn: ['admin_manual'] },
      },
      _sum: { paymentAmount: true },
      _count: true,
    }),
    // Текущий месяц
    prisma.purchase.aggregate({
      where: {
        paymentStatus: 'COMPLETED',
        paymentMethod: { notIn: ['admin_manual'] },
        purchasedAt: { gte: startOfMonth },
      },
      _sum: { paymentAmount: true },
      _count: true,
    }),
    // Кол-во платных покупок (для среднего чека)
    prisma.purchase.count({
      where: {
        paymentStatus: 'COMPLETED',
        paymentMethod: { notIn: ['admin_manual'] },
      },
    }),
  ]);

  const totalRevenue = revenueAgg._sum.paymentAmount ?? 0;
  const monthRevenue = revenueMonthAgg._sum.paymentAmount ?? 0;
  const avgTicket =
    paidPurchases > 0 ? Math.round(totalRevenue / paidPurchases) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Добро пожаловать, {session?.name}!
        </h1>
        <p className="text-gray-600 mt-1">Управление академией</p>
      </div>

      {/* Деньги — отдельным блоком наверху */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RevenueCard
          icon={<Wallet className="w-5 h-5" />}
          label="Выручка всего"
          value={`${totalRevenue.toLocaleString()} ₸`}
          subtitle={`${paidPurchases} ${paidPurchases === 1 ? 'покупка' : 'покупок'}`}
          accent="primary"
        />
        <RevenueCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="В этом месяце"
          value={`${monthRevenue.toLocaleString()} ₸`}
          subtitle={`${revenueMonthAgg._count} ${revenueMonthAgg._count === 1 ? 'покупка' : 'покупок'}`}
          accent="green"
        />
        <RevenueCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Средний чек"
          value={
            avgTicket > 0 ? `${avgTicket.toLocaleString()} ₸` : '—'
          }
          subtitle="по платным покупкам"
          accent="blue"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <StatCard icon={<BookOpen className="w-4 h-4" />} label="Курсов" value={totalCourses} color="primary" />
        <StatCard icon={<Layers className="w-4 h-4" />} label="Разделов" value={totalModules} color="blue" />
        <StatCard icon={<Video className="w-4 h-4" />} label="Уроков" value={totalLessons} color="green" />
        <StatCard icon={<Users className="w-4 h-4" />} label="Студентов" value={totalStudents} color="orange" />
        <StatCard
          icon={<ShoppingBag className="w-4 h-4" />}
          label="Активных покупок"
          value={activePurchases}
          color="purple"
          className="col-span-2 md:col-span-1"
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-900">Быстрые действия</h2>
        <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
          <Link
            href="/admin/courses"
            className="flex items-center gap-3.5 p-3.5 bg-white border border-gray-100 rounded-2xl shadow-soft hover:border-primary-200 transition-all active:scale-[0.99]"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900">Все курсы</div>
              <div className="text-xs text-gray-400">Управление курсами</div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </Link>
          <Link
            href="/admin/courses/create"
            className="flex items-center gap-3.5 p-3.5 bg-white border border-gray-100 rounded-2xl shadow-soft hover:border-blue-200 transition-all active:scale-[0.99]"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Plus className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900">Создать курс</div>
              <div className="text-xs text-gray-400">Добавить новый курс</div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </Link>
        </div>
      </div>

      {recent.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Последние курсы</h2>
            <Link
              href="/admin/courses"
              className="text-xs font-semibold text-primary-600 flex items-center gap-1 hover:underline"
            >
              Смотреть все
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {recent.map((course) => (
              <Link
                key={course.id}
                href={`/admin/courses/${course.id}`}
                className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl shadow-soft hover:border-gray-200 transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{course.title}</p>
                  <p className="text-xs text-gray-400">{course._count.modules} разделов</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RevenueCard({
  icon,
  label,
  value,
  subtitle,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
  accent: 'primary' | 'green' | 'blue';
}) {
  const cardTone: Record<string, string> = {
    primary: 'hover:border-primary-200',
    green: 'hover:border-green-200',
    blue: 'hover:border-blue-200',
  };
  const iconTone: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
  };
  return (
    <div className={`bg-white border border-gray-100 rounded-2xl p-4 shadow-soft transition-colors ${cardTone[accent]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconTone[accent]}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
      <p className="text-[11px] text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  className = '',
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'primary' | 'blue' | 'green' | 'orange' | 'purple';
  className?: string;
}) {
  const tone: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className={`bg-white border border-gray-100 rounded-2xl p-3.5 shadow-soft flex items-center gap-3 ${className}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tone[color]}`}>{icon}</div>
      <div>
        <div className="text-lg font-bold text-gray-900 leading-none mb-1">{value}</div>
        <div className="text-[11px] font-medium text-gray-400">{label}</div>
      </div>
    </div>
  );
}
