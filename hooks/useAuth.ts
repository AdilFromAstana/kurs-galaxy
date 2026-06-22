'use client';

import { useSession } from '@/components/providers/SessionProvider';

export const useAuth = () => {
  const session = useSession();

  return {
    user: session.user,
    isLoading: session.isLoading,
    isAuthenticated: !!session.user,
    login: async (email: string, password: string) => {
      const r = await session.login(email, password);
      return r.ok;
    },
    register: async (data: { name: string; email: string; password: string }) => {
      return session.register(data.name, data.email, data.password);
    },
    logout: () => session.logout(),
  };
};
