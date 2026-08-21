import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, UserRole } from '@/types';
import { loginApi, getCurrentUserApi, logoutApi } from '@/api/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
  bootstrap: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  /**
   * Bootstrap the auth state by calling /api/auth/me. Succeeds if the browser
   * still has a valid httpOnly access or refresh cookie; the cookie itself is
   * never visible to JavaScript (XSS-safe).
   */
  const bootstrap = useCallback(async () => {
    try {
      const me = await getCurrentUserApi();
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (username: string, password: string) => {
    const response = await loginApi(username, password);
    setUser(response.user);
    // The backend sets httpOnly cookies automatically — no JS storage needed.
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Logout is best-effort; clear local state regardless.
    }
    setUser(null);
    window.location.href = '/login';
  }, []);

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      return user ? roles.includes(user.role) : false;
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        hasRole,
        bootstrap,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}