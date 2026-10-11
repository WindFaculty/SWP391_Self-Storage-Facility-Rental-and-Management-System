import { api } from '../../../api/api'
import type { AuthPayload, AuthUser, LoginRequest, RegisterRequest } from '../types'

export const authApi = {
  googleConfig: (): Promise<{ enabled: boolean }> => api.get('/auth/google/config'),
  cookieLogin: (payload: LoginRequest): Promise<{ user: AuthUser }> =>
    api.post('/auth/cookie/login', payload),
  cookieRegister: (payload: RegisterRequest): Promise<{ user: AuthUser }> =>
    api.post('/auth/cookie/register', payload),
  logout: (): Promise<unknown> => api.post('/auth/cookie/logout'),
  login: (payload: LoginRequest): Promise<AuthPayload> => api.post('/auth/login', payload),
  register: (payload: RegisterRequest): Promise<AuthPayload> => api.post('/auth/register', payload),
  me: (): Promise<AuthUser> => api.get('/auth/me'),
  refresh: (refreshToken: string): Promise<AuthPayload> =>
    api.post('/auth/refresh', { refreshToken }),
}
