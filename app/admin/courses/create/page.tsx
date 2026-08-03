"use client";

import { BookOpen, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60) || `course-${Date.now()}`;
}

export default function CreateCoursePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Очистить ошибку при изменении
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Название обязательно";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Описание обязательно";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const createRes = await fetch('/api/admin/courses', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: slugify(formData.title),
          title: formData.title.trim(),
          description: formData.description.trim(),
        }),
      });
      const createData = await createRes.json().catch(() => ({}));
      if (!createRes.ok) {
        setErrors({ title: createData.error ?? 'Не удалось создать курс' });
        return;
      }

      const courseId = createData.course.id as string;

      toast.success('Курс создан');
      router.push(`/admin/courses/${courseId}`);
    } catch (error) {
      console.error('Ошибка создания курса:', error);
      toast.error('Ошибка при создании курса');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/courses"
          className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary-600" />
            Создание курса
          </h1>
        </div>
      </div>

      {/* Форма создания */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 space-y-6">
          <h2 className="text-lg font-bold text-gray-900">
            Основная информация
          </h2>

          {/* Название */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Название курса <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.title ? "border-red-300" : "border-gray-300"
              } focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
              placeholder="Например: Профессиональный курс PRO"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Описание */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Описание курса <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.description ? "border-red-300" : "border-gray-300"
              } focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none`}
              placeholder="Опишите, что студенты узнают и чему научатся..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>
        </div>

        {/* Информационная панель */}
        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Что дальше?</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• После создания добавьте разделы и уроки с видео</li>
                <li>• Цену и период доступа задайте в разделе «Тарифы» курса</li>
                <li>• Опубликуйте курс, чтобы он появился в каталоге</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 sm:justify-end">
          <Link
            href="/admin/courses"
            className="w-full sm:w-auto text-center px-6 py-3 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100 rounded-lg font-medium"
          >
            Отмена
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {isSubmitting ? "Создание..." : "Создать курс"}
          </button>
        </div>
      </form>
    </div>
  );
}
