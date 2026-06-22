'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Award, ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/auth/request-reset', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // Всегда показываем одно и то же сообщение — даже если email не зарегистрирован,
      // чтобы по интерфейсу нельзя было определить, есть ли такой пользователь.
      setDone(true);
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
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Award className="w-9 h-9 text-white" />
            </div>
          </div>

          <h1 className="text-center mb-2">Забыли пароль?</h1>
          <p className="text-center text-dark-600 mb-6">
            Введите email — мы отправим ссылку для сброса
          </p>

          {done ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                <Mail className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-800 mb-1">
                    Письмо отправлено
                  </p>
                  <p className="text-sm text-green-700">
                    Если этот email зарегистрирован, на него придёт ссылка для
                    сброса пароля. Письмо может прийти в течение нескольких
                    минут — проверьте также папку «Спам».
                  </p>
                </div>
              </div>
              <div className="text-center text-sm text-dark-500">
                <Link
                  href="/auth/login"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Вернуться ко входу
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="label">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  className="input"
                  placeholder="anna@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary w-full mt-4 disabled:opacity-50"
              >
                {submitting ? 'Отправляем...' : 'Отправить ссылку'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
