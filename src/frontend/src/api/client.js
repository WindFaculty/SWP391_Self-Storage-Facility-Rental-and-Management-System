const BASE_URL = '/api/v1';

class ApiClient {
  getToken() {
    return localStorage.getItem('storage_access_token');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('storage_access_token', token);
    } else {
      localStorage.removeItem('storage_access_token');
    }
  }

  getRefreshToken() {
    return localStorage.getItem('storage_refresh_token');
  }

  setRefreshToken(token) {
    if (token) {
      localStorage.setItem('storage_refresh_token', token);
    } else {
      localStorage.removeItem('storage_refresh_token');
    }
  }

  clearTokens() {
    localStorage.removeItem('storage_access_token');
    localStorage.removeItem('storage_refresh_token');
    localStorage.removeItem('storage_user');
  }

  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          this.clearTokens();
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
        const errorMessage = data?.error?.message || data?.message || 'Có lỗi xảy ra khi xử lý yêu cầu';
        const error = new Error(errorMessage);
        error.status = response.status;
        error.code = data?.error?.code;
        error.details = data?.error?.details;
        throw error;
      }

      return data;
    } catch (err) {
      throw err;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

export const authApi = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  getMe: () => apiClient.get('/auth/me'),
  refreshToken: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken }),
};
