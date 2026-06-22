'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Settings, User, LogOut, Lock, Save, AlertCircle, Mail, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { confirmToast } from '@/lib/toastConfirm';

type AdminMe = { adminId: string; email: string; name: string; role: string };

export default function SettingsPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // Смена пароля
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const res = await fetch('/api/admin/me', { credentials: 'include' });
      if (!cancel) {
        if (res.ok) {
          const data = await res.json();
          setAdmin(data.admin);
        }
        setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch('/api/admin/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    router.push('/admin/login');
    router.refresh();
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPwdError(null);

    if (newPassword !== confirm) {
      setPwdError('Пароли не совпадают');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('Новый пароль должен быть не короче 6 символов');
      return;
    }

    setSavingPwd(true);
    try {
      const res = await fetch('/api/admin/auth/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPwdError(data.message || data.error || 'Не удалось сменить пароль');
        return;
      }
      toast.success('Пароль обновлён');
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8 max-w-4xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary-600" />
          Настройки администратора
        </h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          Профиль, смена пароля, выход
        </p>
      </div>

      {/* Профиль */}
      <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          Профиль администратора
        </h2>

        {loading ? (
          <p className="text-gray-500">Загрузка...</p>
        ) : admin ? (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div>
              <span className="text-sm text-gray-600">Имя:</span>
              <p className="font-semibold text-gray-900">{admin.name}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Email:</span>
              <p className="font-semibold text-gray-900">{admin.email}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Роль:</span>
              <p className="font-semibold text-gray-900">{admin.role}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Не удалось загрузить профиль</p>
        )}
      </div>

      {/* Смена пароля */}
      <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary-600" />
          Смена пароля
        </h2>

        {pwdError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{pwdError}</p>
          </div>
        )}

        <form
          onSubmit={handlePasswordSubmit}
          className="space-y-4 max-w-md"
          autoComplete="off"
        >
          <div>
            <label
              htmlFor="cur-pwd"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Текущий пароль
            </label>
            <input
              id="cur-pwd"
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="new-pwd"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Новый пароль
            </label>
            <input
              id="new-pwd"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Минимум 6 символов</p>
          </div>
          <div>
            <label
              htmlFor="confirm-pwd"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Подтверждение нового пароля
            </label>
            <input
              id="confirm-pwd"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={savingPwd}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-lg font-semibold disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {savingPwd ? 'Сохранение...' : 'Сменить пароль'}
          </button>
        </form>
      </div>

      {/* Email-рассылки */}
      <EmailToolsSection />

      {/* Сессия */}
      <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Сессия</h2>
        <p className="text-sm text-gray-600 mb-4">
          Выход завершает сеанс администратора. Чтобы вернуться, потребуется
          повторно войти.
        </p>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-2 px-6 py-3 text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg font-semibold disabled:opacity-50"
        >
          <LogOut className="w-5 h-5" />
          {loggingOut ? 'Выход...' : 'Выйти из админки'}
        </button>
      </div>
    </div>
  );
}

function EmailToolsSection() {
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const res = await fetch('/api/admin/email/expiry-warnings', {
        credentials: 'include',
      });
      if (!cancel && res.ok) {
        const d = await res.json();
        setCount(d.count ?? 0);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const handleSend = async () => {
    if (count === 0) {
      toast('Никому не нужно слать — нет истекающих доступов');
      return;
    }
    const ok = await confirmToast({
      message: `Отправить ${count ?? '?'} писем студентам, у которых доступ истекает в ближайшие 7 дней?`,
      confirmText: 'Отправить',
    });
    if (!ok) return;
    setBusy(true);
    const res = await fetch('/api/admin/email/expiry-warnings', {
      method: 'POST',
      credentials: 'include',
    });
    setBusy(false);
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error('Не удалось отправить рассылку');
      return;
    }
    toast.success(
      `Отправлено: ${d.sent}/${d.total}${d.failed > 0 ? `, ошибок: ${d.failed}` : ''}`,
    );
    setCount(0);
  };

  return (
    <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
        <Mail className="w-5 h-5 text-blue-600" />
        Email-рассылки
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Уведомление об истечении доступа отправляется студентам, у которых до
        конца доступа осталось 7 дней или меньше.
      </p>
      <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            Сейчас истекает у
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {count === null ? '—' : count}
          </div>
        </div>
        <button
          onClick={handleSend}
          disabled={busy || count === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {busy ? 'Отправка...' : 'Отправить уведомления'}
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-3">
        💡 В будущем эту рассылку можно поставить в крон чтобы запускалась
        автоматически каждое утро.
      </p>
    </div>
  );
}
