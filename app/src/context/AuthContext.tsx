import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { setAccessToken } from '@/api/client';
import { authApi } from '@/api/auth';
import type { UserOut } from '@/types/api';

interface AuthContextValue {
  user: UserOut | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    setAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const refreshRes = await authApi.refresh();
        setAccessToken(refreshRes.data.access_token);
        const meRes = await authApi.me();
        setUser(meRes.data);
      } catch {
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const handler = () => { setUser(null); setAccessToken(null); };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tokenRes = await authApi.login(email, password);
    setAccessToken(tokenRes.data.access_token);
    const meRes = await authApi.me();
    setUser(meRes.data);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      isLoading,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
