// Типы для модуля администратора

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  password: string; // Хешированный
  role: 'admin' | 'teacher';
  createdAt: string;
}

export interface AdminSession {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'teacher';
  expiresAt: number;
}

export interface AdminCredentials {
  email: string;
  password: string;
}

export interface LessonFormData {
  title: string;
  description?: string;
  content: string;
  duration: string;
  videoUrl: string;
  videoType?: 'url' | 'youtube' | 'upload';
  thumbnail?: string;
  isFree: boolean;
  order: number;
  moduleId: string;
}

export interface ModuleFormData {
  title: string;
  description: string;
  order: number;
}

export interface DragItem {
  id: string;
  type: 'module' | 'lesson';
  order: number;
}
