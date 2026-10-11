import { apiClient, type ApiResponse } from '../../../api/client';
import type { AuthPayload, AuthUser, LoginRequest, RegisterRequest } from '../types';

export const authApi = {
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
