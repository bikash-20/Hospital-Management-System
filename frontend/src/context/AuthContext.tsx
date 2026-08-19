import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, UserRole } from '@/types';
import { loginApi } from '@/api/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('oh_token');
    const storedUser = localStorage.getItem('oh_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const response = await loginApi(username, password);
    setUser(response.user);
    setToken(response.accessToken);
    localStorage.setItem('oh_token', response.accessToken);
    localStorage.setItem('oh_user', JSON.stringify(response.user));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('oh_token');
    localStorage.removeItem('oh_user');
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
        token,
        isAuthenticated: !!user,
        login,
        logout,
        hasRole,
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
