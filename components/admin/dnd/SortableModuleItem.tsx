'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit, Trash2, ChevronRight } from 'lucide-react';
import type { Module } from '@/types';

interface Props {
  module: Module;
  onEdit: (moduleId: string) => void;
  onDelete: (moduleId: string) => void;
}

export function SortableModuleItem({ module, onEdit, onDelete }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border-2 ${
        isDragging ? 'border-primary-500 shadow-lg' : 'border-gray-200'
      } active:border-primary-300 transition-all`}
    >
      <div className="p-3 md:p-4">
        {/* Mobile: Вертикальная компоновка */}
        <div className="flex items-start gap-3">
          {/* Drag Handle - УВЕЛИЧЕННЫЙ для пальцев */}
          <button
            {...attributes}
            {...listeners}
            className="flex-shrink-0 p-2 -m-2 text-gray-400 active:text-primary-600 touch-manipulation"
            aria-label="Перетащить"
          >
            <GripVertical className="w-7 h-7 md:w-6 md:h-6" />
          </button>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                #{(module.order ?? 0) + 1}
              </span>
            </div>
            
            <h3 className="font-semibold text-gray-900 text-base mb-1">
              {module.title}
            </h3>
            
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
              {module.description}
            </p>
            
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>{module.lessons?.length || 0} уроков</span>
            </div>
          </div>
        </div>
        
        {/* Actions - БОЛЬШИЕ кнопки для пальцев */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={() => onEdit(module.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-blue-600 bg-blue-50 active:bg-blue-100 rounded-lg touch-manipulation font-medium"
          >
            <Edit className="w-4 h-4" />
            <span>Редактировать</span>
          </button>
          
          <button
            onClick={() => onDelete(module.id)}
            className="px-4 py-2.5 text-red-600 bg-red-50 active:bg-red-100 rounded-lg touch-manipulation"
            aria-label="Удалить"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          
          <button
            className="px-4 py-2.5 text-gray-600 bg-gray-50 active:bg-gray-100 rounded-lg touch-manipulation"
            aria-label="Уроки модуля"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
