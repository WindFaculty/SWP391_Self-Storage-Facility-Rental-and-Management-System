import { createContext } from 'react';
import type { AuthUser, LoginRequest, RegisterRequest } from './types';

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<AuthUser>;
  register: (payload: RegisterRequest) => Promise<AuthUser>;
  logout: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
