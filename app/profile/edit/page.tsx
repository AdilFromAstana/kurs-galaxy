'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Lock, AlertCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import { useSession } from '@/components/providers/SessionProvider';

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, isLoading, refresh } = useSession();
  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  useEffect(() => {
    if (!isLoading && !user) router.push('/auth/login');
  }, [isLoading, user, router]);

  const handleNameSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileMsg(null);
    setSavingName(true);
    try {
      const res = await fetch('/api/me/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProfileError(data.error ?? 'Не удалось сохранить');
        return;
      }
      setProfileMsg('Имя обновлено');
      await refresh();
    } finally {
      setSavingName(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdMsg(null);
    if (newPassword !== confirm) {
      setPwdError('Пароли не совпадают');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('Пароль должен быть не короче 6 символов');
      return;
    }
    setSavingPwd(true);
    try {
      const res = await fetch('/api/me/profile', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPwdError(data.error ?? 'Ошибка');
        return;
      }
      setPwdMsg('Пароль обновлён');
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen page-wrapper">
        <div className="container-custom max-w-2xl">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-dark-600 hover:text-dark-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>К профилю</span>
          </Link>

          <h1 className="mb-6">Настройки профиля</h1>

          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-4">Личные данные</h2>
            {profileError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {profileError}
              </div>
            )}
            {profileMsg && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                {profileMsg}
              </div>
            )}
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="label">
                  Имя
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <span className="label">Email</span>
                <p className="text-dark-700">{user?.email}</p>
              </div>
              <button type="submit" disabled={savingName} className="btn btn-primary disabled:opacity-50">
                <Save className="w-4 h-4 mr-2 inline" />
                {savingName ? 'Сохранение...' : 'Сохранить имя'}
              </button>
            </form>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Смена пароля
            </h2>
            {pwdError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {pwdError}
              </div>
            )}
            {pwdMsg && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                {pwdMsg}
              </div>
            )}
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="cur" className="label">
                  Текущий пароль
                </label>
                <input
                  id="cur"
                  type="password"
                  required
                  className="input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="new" className="label">
                  Новый пароль
                </label>
                <input
                  id="new"
                  type="password"
                  required
                  minLength={6}
                  className="input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="confirm" className="label">
                  Подтверждение
                </label>
                <input
                  id="confirm"
                  type="password"
                  required
                  minLength={6}
                  className="input"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              <button type="submit" disabled={savingPwd} className="btn btn-primary disabled:opacity-50">
                <Save className="w-4 h-4 mr-2 inline" />
                {savingPwd ? 'Сохранение...' : 'Изменить пароль'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
