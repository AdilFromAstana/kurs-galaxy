import { getSession } from '@/lib/auth/actions';
import { MobileHeader } from '@/components/admin/MobileHeader';
import { MobileBottomNav } from '@/components/admin/MobileBottomNav';

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
  
  // MOBILE FIRST Layout
  return (
    <div className="min-h-screen bg-gray-50">
      {/* МОБИЛЬНАЯ ВЕРСИЯ (приоритет!) */}
      <div className="md:hidden">
        <MobileHeader session={session} />
        <main className="pb-4">
          <div className="p-4">
            {children}
          </div>
        </main>
        <MobileBottomNav />
      </div>
      
      {/* ДЕСКТОПНАЯ ВЕРСИЯ (пока простая) */}
      <div className="hidden md:block">
        <div className="min-h-screen p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Админ-панель</h1>
                  <p className="text-gray-600 mt-1">Добро пожаловать, {session.name}</p>
                </div>
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
        </div>
      </div>
    </div>
  );
}
