import type { AdminUser, AdminSession, AdminCredentials } from '@/types/admin';

const ADMIN_STORAGE_KEY = 'nail_admin_users';
const ADMIN_SESSION_KEY = 'nail_admin_session';

// Получить список админов из localStorage
export const getAdmins = (): AdminUser[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(ADMIN_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

// Простое хеширование для демонстрации (в продакшене использовать bcrypt)
const hashPassword = (password: string): string => {
  // Простое хеширование для демо
  return btoa(password);
};

const verifyPassword = (password: string, hash: string): boolean => {
  return btoa(password) === hash;
};

// Создать админа
export const createAdmin = (email: string, password: string, name: string): AdminUser => {
  const admins = getAdmins();
  
  // Проверка на существование
  if (admins.find(a => a.email === email)) {
    throw new Error('Админ с таким email уже существует');
  }
  
  const hashedPassword = hashPassword(password);
  
  const newAdmin: AdminUser = {
    id: crypto.randomUUID(),
    email,
    password: hashedPassword,
    name,
    role: 'admin',
    createdAt: new Date().toISOString()
  };
  
  admins.push(newAdmin);
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(admins));
  
  return newAdmin;
};

// Авторизация админа
export const loginAdmin = (email: string, password: string): AdminSession => {
  const admins = getAdmins();
  const admin = admins.find(a => a.email === email);
  
  if (!admin) {
    throw new Error('Админ не найден');
  }
  
  const isValid = verifyPassword(password, admin.password);
  
  if (!isValid) {
    throw new Error('Неверный пароль');
  }
  
  const session: AdminSession = {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 часа
  };
  
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  
  return session;
};

// Получить текущую сессию
export const getAdminSession = (): AdminSession | null => {
  if (typeof window === 'undefined') return null;
  
  const data = localStorage.getItem(ADMIN_SESSION_KEY);
  if (!data) return null;
  
  const session: AdminSession = JSON.parse(data);
  
  // Проверка срока действия
  if (session.expiresAt < Date.now()) {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    return null;
  }
  
  return session;
};

// Выход из админки
export const logoutAdmin = (): void => {
  localStorage.removeItem(ADMIN_SESSION_KEY);
};

// Проверка является ли пользователь админом
export const isAdmin = (): boolean => {
  const session = getAdminSession();
  return !!session;
};

// Инициализация первого админа (только для первого запуска)
export const initializeFirstAdmin = (): void => {
  const admins = getAdmins();
  
  if (admins.length === 0) {
    createAdmin('admin@nailacademy.com', 'admin123', 'Главный Администратор');
    console.log('✅ Первый админ создан: admin@nailacademy.com / admin123');
  }
};
