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
    // MVP: Простая имитация входа с демо-данными
    const demoEmail = 'user@example.com';
    const demoPassword = 'password123';
    
    console.log('Попытка входа:', { email, password });
    console.log('Сравнение:', { 
      emailMatch: email === demoEmail, 
      passwordMatch: password === demoPassword 
    });
    
    // Проверяем демо-данные
    if (email === demoEmail && password === demoPassword) {
      // Создаем демо-пользователя
      const demoUser: NailUser = {
        email: demoEmail,
        name: 'Демо Пользователь',
        password: demoPassword
      };
      saveUser(demoUser);
      setUserState(demoUser);
      return true;
    }
    
    // Проверяем существующего пользователя
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
