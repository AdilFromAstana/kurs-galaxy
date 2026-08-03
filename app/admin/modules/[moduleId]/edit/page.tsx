'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Trash2, Plus, Pencil } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { confirmToast } from '@/lib/toastConfirm';

type ModuleDTO = {
  id: string;
  title: string;
  description: string;
  courseId: string;
  lessons: Array<{ id: string; title: string; duration: string }>;
};

export default function EditModulePage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.moduleId as string;

  const [module, setModule] = useState<ModuleDTO | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const res = await fetch(`/api/admin/modules/${moduleId}`, { credentials: 'include' });
      if (!cancel) {
        if (res.ok) {
          const data = await res.json();
          setModule(data.module);
          setTitle(data.module.title);
          setDescription(data.module.description);
        }
        setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [moduleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!module) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/admin/modules/${module.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      if (!res.ok) {
        toast.error('Не удалось сохранить раздел');
        return;
      }
      toast.success('Раздел сохранён');
      router.push(`/admin/courses/${module.courseId}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!module) return;
    const ok = await confirmToast({
      message: `Удалить раздел «${module.title}»? Все его уроки тоже удалятся.`,
      confirmText: 'Удалить',
      destructive: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/modules/${module.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      toast.success('Раздел удалён');
      router.push(`/admin/courses/${module.courseId}`);
    } else {
      toast.error('Не удалось удалить раздел');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Раздел не найден</p>
        <Link href="/admin/courses" className="btn btn-primary mt-4 inline-flex">
          Назад к курсам
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <Link
          href={`/admin/courses/${module.courseId}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к курсу
        </Link>
        
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Редактирование раздела
        </h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          ID: {module.id}
        </p>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-soft border border-gray-100">
          {/* Название */}
          <div className="mb-5">
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
          </div>
          
          {/* Описание */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Описание раздела *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Описание содержания раздела..."
              required
            />
          </div>
        </div>
        
        {/* Submit Button - липкая на мобилке */}
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 -mx-4 -mb-4 md:static md:border-0 md:p-0 md:m-0">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            <Save className="w-5 h-5" />
            {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="mt-2 w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
            Удалить раздел
          </button>
        </div>
      </form>
      
      {/* Lessons Section */}
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-soft border border-gray-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            Уроки раздела ({module.lessons?.length || 0})
          </h2>
          <Link
            href={`/admin/lessons/create?courseId=${module.courseId}&moduleId=${module.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 rounded-lg font-medium text-sm whitespace-nowrap flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Добавить урок
          </Link>
        </div>

        {module.lessons && module.lessons.length > 0 ? (
          <div className="space-y-2">
            {module.lessons.map((lesson, index) => (
              <div key={lesson.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl shadow-soft hover:border-gray-200 transition-all">
                <div className="w-8 h-8 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary-600">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate text-sm">{lesson.title}</p>
                  <p className="text-xs text-gray-600">{lesson.duration}</p>
                </div>
                <Link
                  href={`/admin/lessons/${lesson.id}/edit`}
                  className="px-3 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 active:bg-blue-100 rounded-lg touch-manipulation font-medium flex items-center gap-1"
                >
                  <Pencil className="w-4 h-4" />
                  <span className="hidden sm:inline">Изменить</span>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <Link
            href={`/admin/lessons/create?courseId=${module.courseId}&moduleId=${module.id}`}
            className="flex flex-col items-center justify-center gap-2 py-8 text-center border-2 border-dashed border-gray-200 rounded-2xl text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-colors"
          >
            <Plus className="w-6 h-6" />
            <span className="text-sm font-medium">Добавить первый урок</span>
          </Link>
        )}
      </div>
    </div>
  );
}
