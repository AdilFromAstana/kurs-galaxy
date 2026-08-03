'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Award, ArrowLeft, AlertCircle } from 'lucide-react';

function ResetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Пароль должен быть не короче 6 символов');
      return;
    }
    if (password !== confirm) {
      setError('Пароли не совпадают');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Не удалось сбросить пароль');
        return;
      }
      setDone(true);
      setTimeout(() => router.push('/auth/login'), 1500);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen page-wrapper flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-dark-600 hover:text-dark-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Назад к входу
        </Link>

        <div className="card animate-scale-in">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
              <Award className="w-9 h-9 text-white" />
            </div>
          </div>

          <h1 className="text-center mb-2">Новый пароль</h1>
          <p className="text-center text-dark-600 mb-6">Задайте новый пароль для аккаунта</p>

          {!token && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              Ссылка некорректна. Запросите новую через «Забыли пароль».
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {done ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
              Пароль обновлён. Перенаправляем на страницу входа...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="label">Новый пароль</label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="confirm" className="label">Подтверждение</label>
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
              <button
                type="submit"
                disabled={submitting || !token}
                className="btn btn-primary w-full mt-4 disabled:opacity-50"
              >
                {submitting ? 'Сохраняем...' : 'Сменить пароль'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
