'use client';

import { useState, useEffect } from 'react';
import { NailUser } from '@/types';
import { getUser, setUser as saveUser, clearUser, setPurchased, setProgress } from '@/lib/storage';

export const useAuth = () => {
  const [user, setUserState] = useState<NailUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userData = getUser();
    setUserState(userData);
    setIsLoading(false);
  }, []);

  const login = (email: string, password: string): boolean => {
    // Простая имитация - в реальности здесь была бы проверка
    const storedUser = getUser();
    if (storedUser && storedUser.email === email) {
      setUserState(storedUser);
      return true;
    }
    return false;
  };

  const register = (data: NailUser): void => {
    saveUser(data);
    setUserState(data);
    // Инициализация начальных данных
    setPurchased(false);
    setProgress('brow-master-pro', []);
  };

  const logout = (): void => {
    clearUser();
    setUserState(null);
  };

  const isAuthenticated = (): boolean => {
    return user !== null;
  };

  return {
    user,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: isAuthenticated(),
  };
};
