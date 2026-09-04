"use client";

import { BookOpen, ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import { confirmToast } from "@/lib/toastConfirm";
import { CourseLogoUpload } from "@/components/admin/CourseLogoUpload";

type AdminCourse = {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  pricingPlans: Array<{ id: string }>;
  modules: Array<{ id: string; lessons: Array<{ id: string }> }>;
};

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<AdminCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const res = await fetch(`/api/admin/courses/${courseId}`, { credentials: 'include' });
      if (!cancel) {
        if (res.ok) {
          const data = await res.json();
          setCourse(data.course);
          setFormData({ title: data.course.title, description: data.course.description });
          setThumbnailUrl(data.course.thumbnailUrl ?? null);
        }
        setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <BookOpen className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Курс не найден
        </h2>
        <p className="text-gray-600 mb-6">
          Курс с ID "{courseId}" не существует
        </p>
        <Link
          href="/admin/courses"
          className="px-6 py-3 bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 rounded-lg font-medium"
        >
          К списку курсов
        </Link>
      </div>
    );
  }

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
      // Логотип: если выбран новый файл — загружаем его и (если была старая
      // картинка) чистим за собой диск. Если картинку явно удалили и новую
      // не выбрали — отправляем null.
      let finalThumbnailUrl = thumbnailUrl;
      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append('file', logoFile);
        const logoRes = await fetch('/api/admin/course-thumbnail', {
          method: 'POST',
          credentials: 'include',
          body: logoFormData,
        });
        const logoData = await logoRes.json().catch(() => ({}));
        if (!logoRes.ok) {
          toast.error(logoData.message || logoData.error || 'Не удалось загрузить логотип');
          setIsSubmitting(false);
          return;
        }
        finalThumbnailUrl = logoData.url;
        if (course?.thumbnailUrl && course.thumbnailUrl !== finalThumbnailUrl) {
          fetch(`/api/admin/course-thumbnail?url=${encodeURIComponent(course.thumbnailUrl)}`, {
            method: 'DELETE',
            credentials: 'include',
          }).catch(() => {});
        }
      } else if (course?.thumbnailUrl && !thumbnailUrl) {
        fetch(`/api/admin/course-thumbnail?url=${encodeURIComponent(course.thumbnailUrl)}`, {
          method: 'DELETE',
          credentials: 'include',
        }).catch(() => {});
      }

      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          thumbnailUrl: finalThumbnailUrl,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors({ title: data.error ?? 'Ошибка обновления курса' });
        return;
      }
      router.push(`/admin/courses/${courseId}`);
    } catch (error) {
      console.error('Ошибка обновления курса:', error);
      toast.error('Ошибка при обновлении курса');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirmToast({
      message: `Удалить курс «${course.title}»? Все разделы и уроки тоже удалятся. Действие необратимо.`,
      confirmText: 'Удалить',
      destructive: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/courses/${courseId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      toast.success('Курс удалён');
      router.push('/admin/courses');
    } else {
      toast.error('Не удалось удалить курс');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/courses/${courseId}`}
          className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <div className="flex-1 flex items-center gap-4">
          <CourseLogoUpload
            savedUrl={thumbnailUrl}
            file={logoFile}
            onFileSelect={setLogoFile}
            onRemove={() => {
              setLogoFile(null);
              setThumbnailUrl(null);
            }}
            size={64}
          />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Редактирование курса
            </h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">
              {course.title}
            </p>
          </div>
        </div>
      </div>

      {/* Форма редактирования */}
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

          {/* Тарифы */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-sm text-gray-700">
              Цена и тарифы: настроено {course?.pricingPlans?.length || 0}
            </p>
            <Link
              href={`/admin/courses/${courseId}/pricing`}
              className="text-sm font-medium text-primary-600 hover:text-primary-700 whitespace-nowrap"
            >
              Управление тарифами →
            </Link>
          </div>
        </div>

        {/* Информация о курсе */}
        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Статистика курса</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Разделов: {course.modules.length}</li>
                <li>
                  • Уроков:{" "}
                  {course.modules.reduce(
                    (sum, module) => sum + module.lessons.length,
                    0,
                  )}
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 md:justify-between">
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center justify-center gap-2 px-6 py-3 text-red-600 bg-white border border-red-300 hover:bg-red-50 active:bg-red-100 rounded-lg font-medium"
          >
            <Trash2 className="w-5 h-5" />
            Удалить курс
          </button>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Link
              href={`/admin/courses/${courseId}`}
              className="px-6 py-3 text-center text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100 rounded-lg font-medium"
            >
              Отмена
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {isSubmitting ? "Сохранение..." : "Сохранить изменения"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
