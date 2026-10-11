export interface ApiResponse<T> {
  data: T;
  message?: string;
}

interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
  message?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');
const ACCESS_TOKEN_KEY = 'storage_access_token';
const REFRESH_TOKEN_KEY = 'storage_refresh_token';
const USER_KEY = 'storage_user';

const storage = typeof localStorage === 'undefined' ? null : localStorage;

class ApiClient {
  private accessToken = storage?.getItem(ACCESS_TOKEN_KEY) ?? null;
  private refreshToken = storage?.getItem(REFRESH_TOKEN_KEY) ?? null;

  getToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  setToken(token: string | null): void {
    this.accessToken = token;
    if (!storage) return;
    if (token) {
      storage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      storage.removeItem(ACCESS_TOKEN_KEY);
    }
  }

  setRefreshToken(token: string | null): void {
    this.refreshToken = token;
    if (!storage) return;
    if (token) {
      storage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      storage.removeItem(REFRESH_TOKEN_KEY);
    }
  }

  clearTokens(): void {
    this.setToken(null);
    this.setRefreshToken(null);
    storage?.removeItem(USER_KEY);
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }

    const response = await fetch(`${BASE_URL}/${endpoint.replace(/^\/+/, '')}`, {
      ...options,
      headers,
    });
    const body: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401) {
        this.clearTokens();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
          window.location.assign('/auth');
        }
      }
      const payload = body as ApiErrorPayload | null;
      throw new ApiError(
        response.status,
        payload?.error?.message ?? payload?.message ?? 'Có lỗi xảy ra khi xử lý yêu cầu',
        payload?.error?.code,
        payload?.error?.details,
      );
    }

    return body as T;
  }

  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T, B = unknown>(endpoint: string, body: B, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
  }

  put<T, B = unknown>(endpoint: string, body: B, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) });
  }

  patch<T, B = unknown>(endpoint: string, body: B, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) });
  }

  delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
