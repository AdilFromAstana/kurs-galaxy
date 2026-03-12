import { loginAction } from '@/lib/auth/actions';
import { Lock, Mail } from 'lucide-react';

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-600 rounded-2xl mb-4">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Админ-панель</h1>
          <p className="text-gray-600 mt-2">KursGalaxy.kz</p>
        </div>
        
        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 animate-slide-up">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Вход</h2>
          
          {/* Demo credentials hint */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Демо доступ:</strong>
              <br />
              Email: admin@nailacademy.com
              <br />
              Пароль: admin123
            </p>
          </div>
          
          <form action={loginAction} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  defaultValue="admin@nailacademy.com"
                  className="w-full pl-12 pr-4 py-3 md:py-4 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="admin@nailacademy.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            
            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  defaultValue="admin123"
                  className="w-full pl-12 pr-4 py-3 md:py-4 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              className="w-full px-6 py-4 text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-lg transition-colors touch-manipulation"
            >
              Войти
            </button>
          </form>
        </div>
        
        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Только для администраторов
        </p>
      </div>
    </div>
  );
}
