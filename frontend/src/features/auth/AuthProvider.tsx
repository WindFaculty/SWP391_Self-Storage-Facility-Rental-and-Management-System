import { useEffect, useState, type ReactNode } from 'react';
import { apiClient } from '../../api/client';
import { authApi } from './api/authApi';
import { AuthContext } from './auth-context';
import type { AuthUser, LoginRequest, RegisterRequest } from './types';

const USER_KEY = 'storage_user';

const readStoredUser = (): AuthUser | null => {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
};

const storeUser = (user: AuthUser | null): void => {
  if (typeof localStorage === 'undefined') return;
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);
  const [isLoading, setIsLoading] = useState(() => Boolean(apiClient.getToken()));

  useEffect(() => {
    if (!apiClient.getToken()) return;
    let cancelled = false;

    authApi
      .me()
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        storeUser(me);
      })
      .catch(() => {
        if (cancelled) return;
        apiClient.clearTokens();
        storeUser(null);
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (payload: LoginRequest): Promise<AuthUser> => {
    const { accessToken, refreshToken, user: loggedIn } = await authApi.login(payload);
    apiClient.setToken(accessToken);
    apiClient.setRefreshToken(refreshToken);
    storeUser(loggedIn);
    setUser(loggedIn);
    return loggedIn;
  };

  const register = async (payload: RegisterRequest): Promise<AuthUser> => {
    const { accessToken, refreshToken, user: created } = await authApi.register(payload);
    apiClient.setToken(accessToken);
    apiClient.setRefreshToken(refreshToken);
    storeUser(created);
    setUser(created);
    return created;
  };

  const logout = (): void => {
    apiClient.clearTokens();
    storeUser(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user && apiClient.getToken()),
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
