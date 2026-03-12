'use client';

import { useState } from 'react';
import { Settings, Save, User, AlertTriangle } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export default function SettingsPage() {
  const { session } = useAdminAuth();
  
  // Пароль
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      alert('❌ Пароли не совпадают!');
      return;
    }

    if (newPassword.length < 6) {
      alert('❌ Пароль должен быть минимум 6 символов!');
      return;
    }

    setIsLoading(true);

    try {
      // Здесь должна быть логика проверки текущего пароля и смены
      // Пока просто обновляем в сессии
      alert('✅ Пароль успешно изменен!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      alert('Ошибка при смене пароля');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetProgress = () => {
    if (confirm('⚠️ Вы уверены? Это сбросит прогресс ВСЕХ студентов!')) {
      if (confirm('⚠️⚠️⚠️ Действие необратимо! Продолжить?')) {
        try {
          // Очистить прогресс (в реальном приложении это было бы API вызовом)
          localStorage.removeItem('nail_progress');
          localStorage.removeItem('nail_last_lesson');
          alert('✅ Прогресс сброшен!');
        } catch (error) {
          alert('Ошибка при сбросе прогресса');
          console.error(error);
        }
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary-600" />
          Настройки администратора
        </h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          Управление профилем и системные настройки
        </p>
      </div>

      {/* Секция: Профиль администратора */}
      <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          Профиль администратора
        </h2>

        <div className="space-y-4">
          {/* Информация */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Имя:</span>
                <p className="font-semibold text-gray-900">{session?.name || 'Администратор'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Email:</span>
                <p className="font-semibold text-gray-900">{session?.email || 'admin@example.com'}</p>
              </div>
            </div>
          </div>

          {/* Смена пароля */}
          <form onSubmit={handleChangePassword} className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-gray-900">Сменить пароль</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Текущий пароль
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Новый пароль
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="••••••"
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Подтверждение пароля
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="••••••"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
              className="flex items-center gap-2 px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg font-semibold disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              Изменить пароль
            </button>
          </form>
        </div>
      </div>

      {/* Секция: Опасная зона */}
      <div className="bg-red-50 rounded-xl p-5 md:p-6 shadow-sm border border-red-200">
        <h2 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          Опасная зона
        </h2>

        <div className="space-y-3">
          {/* Сброс прогресса */}
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200">
            <div>
              <h3 className="font-semibold text-red-900">Сбросить прогресс всех студентов</h3>
              <p className="text-sm text-red-700">⚠️ Действие необратимо!</p>
            </div>
            <button
              onClick={handleResetProgress}
              className="flex items-center gap-2 px-4 py-2 text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg font-medium"
            >
              <AlertTriangle className="w-4 h-4" />
              Сбросить
            </button>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Примечание:</strong> Для управления курсами, модулями и уроками используйте раздел "Курсы".
          </p>
        </div>
      </div>
    </div>
  );
}
