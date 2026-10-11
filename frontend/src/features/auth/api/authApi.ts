import { apiClient, type ApiResponse } from '../../../api/client';
import type { AuthPayload, AuthUser, LoginRequest, RegisterRequest } from '../types';

export const authApi = {
  googleConfig: (): Promise<{ enabled: boolean }> =>
    apiClient.get<ApiResponse<{ enabled: boolean }>>('/auth/google/config').then(res => res.data),
  cookieLogin: (payload: LoginRequest): Promise<{ user: AuthUser }> =>
    apiClient.post<ApiResponse<{ user: AuthUser }>>('/auth/cookie/login', payload).then(res => res.data),
  cookieRegister: (payload: RegisterRequest): Promise<{ user: AuthUser }> =>
    apiClient.post<ApiResponse<{ user: AuthUser }>>('/auth/cookie/register', payload).then(res => res.data),
  cookieFacebookLogin: (token: string): Promise<{ user: AuthUser }> =>
    apiClient.post<ApiResponse<{ user: AuthUser }>>('/auth/cookie/social/facebook', { token }).then(res => res.data),
  logout: (): Promise<unknown> => apiClient.post('/auth/cookie/logout', {}),
  socialLogin: (provider: 'google' | 'facebook', token: string): Promise<AuthPayload> =>
    apiClient.post<ApiResponse<AuthPayload>>(`/auth/social/${provider}`, { token }).then((res) => res.data),
  login: (payload: LoginRequest): Promise<AuthPayload> =>
    apiClient.post<ApiResponse<AuthPayload>, LoginRequest>('/auth/login', payload).then((res) => res.data),

  register: (payload: RegisterRequest): Promise<AuthPayload> =>
    apiClient
      .post<ApiResponse<AuthPayload>, RegisterRequest>('/auth/register', payload)
      .then((res) => res.data),

  me: (): Promise<AuthUser> =>
    apiClient.get<ApiResponse<AuthUser>>('/auth/me').then((res) => res.data),

  refresh: (refreshToken: string): Promise<AuthPayload> =>
    apiClient
      .post<ApiResponse<AuthPayload>>('/auth/refresh', { refreshToken })
      .then((res) => res.data),
};
