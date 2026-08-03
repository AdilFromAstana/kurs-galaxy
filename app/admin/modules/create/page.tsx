"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  FileText,
  BookOpen,
  Info,
  X,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const DESCRIPTION_MAX = 500;

type CourseLite = { id: string; slug: string; title: string; modules: Array<{ id: string }> };

export default function CreateModulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [course, setCourse] = useState<CourseLite | null>(null);
  const [showPositionInfo, setShowPositionInfo] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    let cancel = false;
    (async () => {
      const res = await fetch(`/api/admin/courses/${courseId}`, { credentials: 'include' });
      if (!cancel && res.ok) {
        const data = await res.json();
        setCourse(data.course);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/admin/courses/${courseId}/modules`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? 'Не удалось создать раздел');
        return;
      }
      toast.success('Раздел создан');
      router.push(`/admin/courses/${courseId}`);
    } catch (error) {
      toast.error('Ошибка при создании раздела');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Если курс не найден
  if (courseId && !course) {
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

  const backLink = courseId ? `/admin/courses/${courseId}` : "/admin/courses";
  const position = course ? course.modules.length + 1 : 1;
  const descCounterNearLimit = description.length >= DESCRIPTION_MAX;

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in pb-28 md:pb-8">
      {/* Header */}
      <div>
        <Link
          href={backLink}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {course ? `Назад к курсу: ${course.title}` : "Назад к курсам"}
        </Link>

        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Создание раздела
          </h1>

          {course && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowPositionInfo((v) => !v)}
                className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full transition-all active:scale-95"
              >
                <span>Позиция №{position}</span>
                <Info className="w-3.5 h-3.5 text-primary-600" />
              </button>

              {showPositionInfo && (
                <div className="absolute right-0 top-8 w-64 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-xl z-40 space-y-1">
                  <div className="font-semibold flex items-center justify-between text-gray-200">
                    <span>Порядок в курсе</span>
                    <button
                      type="button"
                      onClick={() => setShowPositionInfo(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    Раздел автоматически станет{' '}
                    <strong className="text-primary-400">{position}-м по счёту</strong>.
                    После сохранения порядок можно изменить в настройках курса.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-gray-600 mt-1 text-sm md:text-base">
          {course
            ? `Добавить новый раздел в курс "${course.title}"`
            : "Добавить новый раздел"}
        </p>
      </div>

      {/* Form */}
      <form id="module-form" onSubmit={handleSubmit} className="space-y-5">
        {/* Основная информация */}
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-soft border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Основная информация
          </h2>

          {/* Название */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название раздела *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 md:py-4 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Раздел 1: Основы..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Например: "Раздел 1: Основы работы" или "Введение в курс"
            </p>
          </div>

          {/* Описание */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Описание раздела *
              </label>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                  descCounterNearLimit
                    ? 'text-red-600 bg-red-50 font-bold'
                    : 'text-gray-400 bg-gray-50'
                }`}
              >
                {description.length} / {DESCRIPTION_MAX}
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={DESCRIPTION_MAX}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-sans resize-none"
              placeholder="Краткое описание раздела..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Краткое описание того, что студенты изучат в этом разделе
            </p>
          </div>
        </div>
      </form>

      {/* Action Bar: липкая на мобилке, обычная строка на десктопе */}
      <div className="fixed bottom-16 left-0 right-0 md:static bg-white/95 backdrop-blur-md md:bg-transparent md:backdrop-blur-none border-t border-gray-200 md:border-0 p-3 px-4 md:p-0 z-30 shadow-lg md:shadow-none flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowCancelModal(true)}
          className="w-1/3 md:w-auto py-3 px-3 md:px-6 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl transition-all flex items-center justify-center gap-1.5"
        >
          <X className="w-4 h-4" />
          Отмена
        </button>
        <button
          type="submit"
          form="module-form"
          disabled={isLoading || !courseId}
          className="w-2/3 md:w-auto md:flex-1 py-3 px-4 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-xl shadow-md shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isLoading ? "Создание..." : "Создать раздел"}
        </button>
      </div>

      {/* Подсказка */}
      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-2">💡 Что дальше?</h3>
        <p className="text-sm text-gray-600">
          После создания раздела вы сможете добавить в него уроки на странице
          редактирования раздела.
        </p>
      </div>

      {/* Cancel Confirm Modal */}
      {showCancelModal && (
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowCancelModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-5 w-full max-w-xs shadow-2xl space-y-4"
          >
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto text-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-gray-900 text-base">Отменить создание?</h3>
              <p className="text-xs text-gray-500">
                Введённые данные не будут сохранены.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="w-1/2 py-2.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
              >
                Продолжить
              </button>
              <Link
                href={backLink}
                className="w-1/2 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl flex items-center justify-center"
              >
                Да, выйти
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
