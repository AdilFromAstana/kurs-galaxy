'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getAdminSession, 
  loginAdmin, 
  logoutAdmin,
  initializeFirstAdmin 
} from '@/lib/adminAuth';
import type { AdminSession } from '@/types/admin';

export function useAdminAuth() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    // Инициализировать первого админа при первом запуске
    initializeFirstAdmin();
    
    // Проверить текущую сессию
    const checkSession = () => {
      const currentSession = getAdminSession();
      setSession(currentSession);
      setIsLoading(false);
    };
    
    checkSession();
  }, []);
  
  const login = async (email: string, password: string) => {
    try {
      const newSession = loginAdmin(email, password);
      setSession(newSession);
      router.push('/admin');
      return { success: true, error: null };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Ошибка входа' 
      };
    }
  };
  
  const logout = () => {
    logoutAdmin();
    setSession(null);
    router.push('/admin/login');
  };
  
  return {
    session,
    isLoading,
    isAuthenticated: !!session,
    login,
    logout
  };
}
