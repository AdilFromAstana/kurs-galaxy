"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Award, ArrowLeft, AlertCircle } from "lucide-react";
import { useSession } from "@/components/providers/SessionProvider";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useSession();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const r = await login(formData.email, formData.password);
    setSubmitting(false);
    if (r.ok) {
      router.push("/dashboard");
    } else {
      setError(r.error);
    }
  };

  return (
    <div className="min-h-screen page-wrapper flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-dark-600 hover:text-dark-900 mb-6 md:mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Назад</span>
        </Link>

        <div className="card animate-scale-in">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
              <Award className="w-9 h-9 text-white" />
            </div>
          </div>

          <h1 className="text-center mb-2">Вход</h1>
          <p className="text-center text-dark-600 mb-6 md:mb-8">
            Войдите в свой аккаунт
          </p>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-slide-up">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
            <div>
              <label htmlFor="email" className="label">Email</label>
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
              <label htmlFor="password" className="label">Пароль</label>
              <input
                id="password"
                type="password"
                required
                className="input"
                placeholder="Ваш пароль"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-full mt-6 disabled:opacity-50"
            >
              {submitting ? "Входим..." : "Войти"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm">
            <Link href="/auth/forgot" className="text-primary-600 hover:text-primary-700">
              Забыли пароль?
            </Link>
          </div>

          <div className="mt-2 text-center text-sm md:text-base">
            <span className="text-dark-600">Нет аккаунта? </span>
            <Link
              href="/auth/register"
              className="text-primary-600 font-semibold hover:text-primary-700"
            >
              Зарегистрироваться
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
