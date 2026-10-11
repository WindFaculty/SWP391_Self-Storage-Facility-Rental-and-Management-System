import { useEffect, useState, type ReactNode } from 'react';
import { apiClient } from '../../api/client';
import { authApi } from './api/authApi';
import { AuthContext } from './auth-context';
import type { AuthUser, LoginRequest, RegisterRequest } from './types';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [logoutError, setLogoutError] = useState('');
  useEffect(() => {
    let cancelled = false;
    const expired = () => setUser(null);
    window.addEventListener('auth:expired', expired);
    void authApi.me().then(me => {
      if (!cancelled) { apiClient.setCookieSession(true); setUser(me); }
    }).catch(() => {
      if (!cancelled) { apiClient.clearTokens(); setUser(null); }
    }).finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; window.removeEventListener('auth:expired', expired); };
  }, []);
  const acceptSession = async (): Promise<AuthUser> => {
    apiClient.setCookieSession(true);
    const me = await authApi.me();
    setUser(me);
    return me;
  };
  const login = async (payload: LoginRequest): Promise<AuthUser> => {
    await authApi.cookieLogin(payload);
    return acceptSession();
  };
  const register = async (payload: RegisterRequest): Promise<AuthUser> => {
    await authApi.cookieRegister(payload);
    return acceptSession();
  };
  const logout = (): void => {
    setLogoutError('');
    void authApi.logout().then(() => {
      apiClient.clearTokens(); setUser(null);
    }).catch(() => setLogoutError('Không thể đăng xuất. Vui lòng thử lại.'));
  };
  return <AuthContext.Provider value={{ user, isAuthenticated: Boolean(user), isLoading,
    login, register, logout }}>
    {logoutError && <p role="alert" className="fixed bottom-4 right-4 z-50 rounded-md bg-surface p-4 text-danger shadow-raised">{logoutError}</p>}
    {children}
  </AuthContext.Provider>;
};
