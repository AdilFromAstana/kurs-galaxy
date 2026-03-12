'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { courseData } from '@/lib/courseData';
import type { Module } from '@/types';

export default function EditModulePage() {
  const params = useParams();
  const router = useRouter();
  const [module, setModule] = useState<Module | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const foundModule = courseData.modules.find(m => m.id === params.moduleId);
    if (foundModule) {
      setModule(foundModule);
      setTitle(foundModule.title);
      setDescription(foundModule.description);
    }
  }, [params.moduleId]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Обновить модуль в courseData
      const updatedModules = courseData.modules.map(m => 
        m.id === params.moduleId
          ? { ...m, title, description }
          : m
      );
      
      const updatedCourseData = {
        ...courseData,
        modules: updatedModules
      };
      
      localStorage.setItem('nail_course_data', JSON.stringify(updatedCourseData));
      
      // Показать уведомление
      alert('✅ Модуль успешно обновлён!');
      
      // Вернуться к курсу (по умолчанию первый курс)
      router.push('/admin/courses/brow-master-pro');
    } catch (error) {
      alert('Ошибка при сохранении модуля');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!module) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Модуль не найден</p>
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
          href="/admin/courses/brow-master-pro"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к курсу
        </Link>
        
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Редактирование модуля
        </h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          ID: {module.id}
        </p>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-gray-100">
          {/* Название */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название модуля *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 md:py-4 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Модуль 1: Основы..."
              required
            />
          </div>
          
          {/* Описание */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Описание модуля *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Описание содержания модуля..."
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
        </div>
      </form>
      
      {/* Lessons Section */}
      <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Уроки модуля ({module.lessons?.length || 0})
        </h2>
        
        {module.lessons && module.lessons.length > 0 ? (
          <div className="space-y-2">
            {module.lessons.map((lesson, index) => (
              <div key={lesson.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary-700">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate text-sm">{lesson.title}</p>
                  <p className="text-xs text-gray-600">{lesson.duration}</p>
                </div>
                <Link
                  href={`/admin/lessons/${lesson.id}/edit`}
                  className="px-3 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 active:bg-blue-100 rounded-lg touch-manipulation font-medium flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  <span className="hidden sm:inline">Изменить</span>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-sm">Нет уроков в этом модуле</p>
        )}
      </div>
    </div>
  );
}
