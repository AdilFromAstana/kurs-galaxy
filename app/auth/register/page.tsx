'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Award, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    register(formData);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen page-wrapper flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-dark-600 hover:text-dark-900 mb-6 md:mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Назад</span>
        </Link>

        {/* Card */}
        <div className="card animate-scale-in">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Award className="w-9 h-9 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-center mb-2">Регистрация</h1>
          <p className="text-center text-dark-600 mb-6 md:mb-8">
            Создайте аккаунт, чтобы начать обучение
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
            <div>
              <label htmlFor="name" className="label">
                Ваше имя
              </label>
              <input
                id="name"
                type="text"
                required
                className="input"
                placeholder="Анна Иванова"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                className="input"
                placeholder="anna@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Пароль
              </label>
              <input
                id="password"
                type="password"
                required
                className="input"
                placeholder="Минимум 6 символов"
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <button type="submit" className="btn btn-primary w-full mt-6">
              Зарегистрироваться
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center text-sm md:text-base">
            <span className="text-dark-600">Уже есть аккаунт? </span>
            <Link href="/auth/login" className="text-primary-600 font-semibold hover:text-primary-700">
              Войти
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
