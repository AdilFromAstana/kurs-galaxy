import { getSession } from '@/lib/auth/actions';
import { MobileHeader } from '@/components/admin/MobileHeader';
import { MobileBottomNav } from '@/components/admin/MobileBottomNav';
import { AdminDesktopNav } from '@/components/admin/AdminDesktopNav';

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  const session = await getSession();
  
  // Если нет сессии, значит мы на странице логина (middleware это проверяет)
  if (!session) {
    return <>{children}</>;
  }
  
  // Единый рендер контента: хром (мобильный/десктопный) прячется по брейкпоинту,
  // а {children} рендерится один раз.
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Мобильная шапка (сама скрыта на md+) */}
      <MobileHeader session={session} />

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4 md:pt-8 pb-8">
        {/* Десктопная шапка с навигацией */}
        <div className="hidden md:flex bg-white rounded-2xl shadow-soft border border-gray-100 px-6 py-4 mb-6 items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <span className="text-lg font-bold text-primary-600 whitespace-nowrap">KursGalaxy.kz</span>
            <AdminDesktopNav />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 whitespace-nowrap">{session.name}</span>
            <form action={async () => {
              'use server';
              const { logoutAction } = await import('@/lib/auth/actions');
              await logoutAction();
            }}>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Выйти
              </button>
            </form>
          </div>
        </div>

        {children}
      </div>

      {/* Нижняя навигация (сама скрыта на md+) */}
      <MobileBottomNav />
    </div>
  );
}
