'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { Module } from '@/types';
import { SortableModuleItem } from './SortableModuleItem';

interface Props {
  modules: Module[];
  onReorder: (modules: Module[]) => void;
  onEdit: (moduleId: string) => void;
  onDelete: (moduleId: string) => void;
}

export function SortableModuleList({ 
  modules: initialModules, 
  onReorder,
  onEdit,
  onDelete 
}: Props) {
  const [modules, setModules] = useState(initialModules);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setModules((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newModules = arrayMove(items, oldIndex, newIndex);
        
        // Обновить порядковые номера
        const updatedModules = newModules.map((module, index) => ({
          ...module,
          order: index
        }));
        
        // Вызвать колбэк с обновленным порядком
        onReorder(updatedModules);
        
        return updatedModules;
      });
    }
  };
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={modules.map(m => m.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {modules.map((module) => (
            <SortableModuleItem
              key={module.id}
              module={module}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
