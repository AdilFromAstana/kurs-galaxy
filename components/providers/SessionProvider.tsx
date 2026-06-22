'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
};

export type SessionPlan = {
  id: string;
  courseId: string;
  name: string;
  description: string | null;
  accessPeriod: string;
  accessDays: number | null;
  price: number;
  currency: string;
};

export type SessionPurchase = {
  id: string;
  courseId: string;
  planId: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  purchasedAt: string;
  expiresAt: string | null;
  paymentAmount: number;
  paymentCurrency: string;
  plan: SessionPlan;
};

export type SessionProgress = {
  courseId: string;
  lessonId: string;
  completedAt: string;
};

export type SessionLastLesson = {
  courseId: string;
  lessonId: string;
};

type SessionState = {
  user: SessionUser | null;
  purchases: SessionPurchase[];
  progress: SessionProgress[];
  lastLessons: SessionLastLesson[];
  isLoading: boolean;
};

type SessionContextValue = SessionState & {
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => Promise<void>;
  buy: (planId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  markCompleted: (lessonId: string) => Promise<void>;
  isPurchaseActive: (courseId: string) => boolean;
  getActivePurchase: (courseId: string) => SessionPurchase | null;
  getProgressForCourse: (courseId: string) => string[];
  getLastLesson: (courseId: string) => string | null;
};

const SessionContext = createContext<SessionContextValue | null>(null);

async function jsonFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({
    user: null,
    purchases: [],
    progress: [],
    lastLessons: [],
    isLoading: true,
  });

  const refresh = useCallback(async () => {
    const res = await fetch('/api/me', { credentials: 'include' });
    if (res.status === 401) {
      setState({ user: null, purchases: [], progress: [], lastLessons: [], isLoading: false });
      return;
    }
    if (!res.ok) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }
    const data = await res.json();
    setState({
      user: data.user ?? null,
      purchases: data.purchases ?? [],
      progress: data.progress ?? [],
      lastLessons: data.lastLessons ?? [],
      isLoading: false,
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback<SessionContextValue['login']>(
    async (email, password) => {
      const { res, data } = await jsonFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return { ok: false, error: data.error ?? 'Ошибка входа' };
      await refresh();
      return { ok: true };
    },
    [refresh]
  );

  const register = useCallback<SessionContextValue['register']>(
    async (name, email, password) => {
      const { res, data } = await jsonFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) return { ok: false, error: data.error ?? 'Ошибка регистрации' };
      await refresh();
      return { ok: true };
    },
    [refresh]
  );

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setState({ user: null, purchases: [], progress: [], lastLessons: [], isLoading: false });
  }, []);

  const buy = useCallback<SessionContextValue['buy']>(
    async (planId) => {
      const { res, data } = await jsonFetch('/api/purchases', {
        method: 'POST',
        body: JSON.stringify({ planId }),
      });
      if (!res.ok) return { ok: false, error: data.error ?? 'Ошибка покупки' };
      await refresh();
      return { ok: true };
    },
    [refresh]
  );

  const markCompleted = useCallback(
    async (lessonId: string) => {
      await jsonFetch('/api/progress', {
        method: 'POST',
        body: JSON.stringify({ lessonId }),
      });
      await refresh();
    },
    [refresh]
  );

  const isPurchaseActive = useCallback(
    (courseId: string) => {
      const now = Date.now();
      return state.purchases.some(
        (p) =>
          p.courseId === courseId &&
          p.status === 'ACTIVE' &&
          (p.expiresAt === null || new Date(p.expiresAt).getTime() > now)
      );
    },
    [state.purchases]
  );

  const getActivePurchase = useCallback(
    (courseId: string) => {
      const now = Date.now();
      return (
        state.purchases.find(
          (p) =>
            p.courseId === courseId &&
            p.status === 'ACTIVE' &&
            (p.expiresAt === null || new Date(p.expiresAt).getTime() > now)
        ) ?? null
      );
    },
    [state.purchases]
  );

  const getProgressForCourse = useCallback(
    (courseId: string) => state.progress.filter((p) => p.courseId === courseId).map((p) => p.lessonId),
    [state.progress]
  );

  const getLastLesson = useCallback(
    (courseId: string) => state.lastLessons.find((l) => l.courseId === courseId)?.lessonId ?? null,
    [state.lastLessons]
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      ...state,
      refresh,
      login,
      register,
      logout,
      buy,
      markCompleted,
      isPurchaseActive,
      getActivePurchase,
      getProgressForCourse,
      getLastLesson,
    }),
    [
      state,
      refresh,
      login,
      register,
      logout,
      buy,
      markCompleted,
      isPurchaseActive,
      getActivePurchase,
      getProgressForCourse,
      getLastLesson,
    ]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
