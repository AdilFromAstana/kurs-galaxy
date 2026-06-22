import { getSession } from '@/lib/auth/actions';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  Plus,
  ArrowRight,
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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={<BookOpen className="w-5 h-5" />} label="Курсов" value={totalCourses} color="primary" />
        <StatCard icon={<Layers className="w-5 h-5" />} label="Модулей" value={totalModules} color="blue" />
        <StatCard icon={<Video className="w-5 h-5" />} label="Уроков" value={totalLessons} color="green" />
        <StatCard icon={<Users className="w-5 h-5" />} label="Студентов" value={totalStudents} color="orange" />
        <StatCard icon={<ShoppingBag className="w-5 h-5" />} label="Активных покупок" value={activePurchases} color="purple" />
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Быстрые действия</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Link
            href="/admin/courses"
            className="flex items-center gap-4 p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
          >
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Все курсы</p>
              <p className="text-sm text-gray-600">Управление курсами</p>
            </div>
          </Link>
          <Link
            href="/admin/courses/create"
            className="flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
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

      {recent.length > 0 && (
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
            {recent.map((course) => (
              <Link
                key={course.id}
                href={`/admin/courses/${course.id}`}
                className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-primary-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{course.title}</p>
                  <p className="text-sm text-gray-600">{course._count.modules} модулей</p>
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
  const tone: Record<string, string> = {
    primary: 'from-primary-500 to-primary-600 text-white',
    green: 'from-green-500 to-emerald-600 text-white',
    blue: 'from-blue-500 to-indigo-600 text-white',
  };
  return (
    <div
      className={`rounded-xl p-5 shadow-sm bg-gradient-to-br ${tone[accent]}`}
    >
      <div className="flex items-center gap-2 mb-3 opacity-90">
        <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
          {icon}
        </div>
        <p className="text-sm font-medium uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-3xl md:text-4xl font-bold">{value}</p>
      <p className="text-xs opacity-80 mt-1">{subtitle}</p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'primary' | 'blue' | 'green' | 'orange' | 'purple';
}) {
  const tone: Record<string, string> = {
    primary: 'bg-primary-100 text-primary-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    orange: 'bg-orange-100 text-orange-700',
    purple: 'bg-purple-100 text-purple-700',
  };
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tone[color]}`}>{icon}</div>
        <p className="text-xs text-gray-600">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
