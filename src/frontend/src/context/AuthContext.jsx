import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, apiClient } from '../api/client';

const AuthContext = createContext(null);

export const getDefaultRouteForRole = (roles = []) => {
  if (!roles || roles.length === 0) return '/login';
  if (roles.includes('SYSTEM_ADMIN')) return '/admin';
  if (roles.includes('BUSINESS_OPERATIONS_MANAGER')) return '/business-manager';
  if (roles.includes('FACILITY_MANAGER')) return '/facility-manager';
  if (roles.includes('FACILITY_STAFF')) return '/staff';
  if (roles.includes('CUSTOMER')) return '/customer';
  return '/customer';
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('storage_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => apiClient.getToken());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = apiClient.getToken();
      if (storedToken) {
        try {
          const res = await authApi.getMe();
          if (res && res.data) {
            setUser(res.data);
            localStorage.setItem('storage_user', JSON.stringify(res.data));
          }
        } catch (err) {
          console.error('Failed to restore session:', err);
          apiClient.clearTokens();
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res && res.data) {
      const { accessToken, refreshToken, user: userData } = res.data;
      apiClient.setToken(accessToken);
      apiClient.setRefreshToken(refreshToken);
      localStorage.setItem('storage_user', JSON.stringify(userData));
      setToken(accessToken);
      setUser(userData);
      return {
        user: userData,
        defaultRoute: getDefaultRouteForRole(userData.roles),
      };
    }
    throw new Error('Đăng nhập không thành công');
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    if (res && res.data) {
      const { accessToken, refreshToken, user: createdUser } = res.data;
      apiClient.setToken(accessToken);
      apiClient.setRefreshToken(refreshToken);
      localStorage.setItem('storage_user', JSON.stringify(createdUser));
      setToken(accessToken);
      setUser(createdUser);
      return {
        user: createdUser,
        defaultRoute: getDefaultRouteForRole(createdUser.roles),
      };
    }
    throw new Error('Đăng ký không thành công');
  };

  const logout = () => {
    apiClient.clearTokens();
    setUser(null);
    setToken(null);
  };

  const hasRole = (role) => {
    if (!user || !user.roles) return false;
    return user.roles.includes(role) || user.roles.includes('SYSTEM_ADMIN');
  };

  const hasPermission = (permission) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission) || user.roles.includes('SYSTEM_ADMIN');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
