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
export const googleAuthorizationUrl = `${BASE_URL}/oauth2/authorization/google`;

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private cookieSession = false;
  private refreshInFlight: Promise<void> | null = null;

  constructor() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('storage_access_token');
      localStorage.removeItem('storage_refresh_token');
      localStorage.removeItem('storage_user');
    }
  }

  setCookieSession(active: boolean): void { this.cookieSession = active; }

  getToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  setToken(token: string | null): void { this.accessToken = token; }
  setRefreshToken(token: string | null): void { this.refreshToken = token; }
  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.cookieSession = false;
  }

  private async csrfToken(): Promise<string> {
    const response = await fetch(`${BASE_URL}/auth/cookie/csrf`, { credentials: 'include' });
    if (!response.ok) throw new ApiError(response.status, 'Unable to verify session.');
    const body = await response.json() as ApiResponse<{ token: string }>;
    return body.data.token;
  }

  private refreshSession(): Promise<void> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = (async () => {
        const token = await this.csrfToken();
        const response = await fetch(`${BASE_URL}/auth/cookie/refresh`, {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': token }, body: '{}',
        });
        if (!response.ok) throw new ApiError(response.status, 'Session expired. Please sign in again.');
        this.cookieSession = true;
      })().finally(() => { this.refreshInFlight = null; });
    }
    return this.refreshInFlight;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, retried = false): Promise<T> {
    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }
    if (!this.accessToken && (this.cookieSession || endpoint.startsWith('/auth/cookie/')) &&
        !['GET', 'HEAD', 'OPTIONS'].includes(options.method ?? 'GET')) {
      headers.set('X-XSRF-TOKEN', await this.csrfToken());
    }

    const response = await fetch(`${BASE_URL}/${endpoint.replace(/^\/+/, '')}`, {
      ...options,
      credentials: 'include',
      headers,
    });
    const body: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401) {
        if (!retried && !this.accessToken && (this.cookieSession || endpoint === '/auth/me')) {
          let refreshed = false;
          try {
            await this.refreshSession();
            refreshed = true;
          } catch { /* The original authentication error remains authoritative. */ }
          if (refreshed) return this.request<T>(endpoint, options, true);
        }
        this.clearTokens();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth:expired'));
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
