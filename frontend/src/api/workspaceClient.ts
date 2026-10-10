import { apiClient, type ApiResponse } from './client'

export function withQuery(path: string, values: object): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) {
    if (value !== null && value !== undefined && value !== '') query.set(key, String(value))
  }
  return query.size ? `${path}?${query}` : path
}

export const workspaceClient = {
  get: <T>(path: string): Promise<T> => apiClient.get<ApiResponse<T>>(path).then(response => response.data),
  post: <T>(path: string, body: unknown): Promise<T> => apiClient.post<ApiResponse<T>>(path, body).then(response => response.data),
  put: <T>(path: string, body: unknown): Promise<T> => apiClient.put<ApiResponse<T>>(path, body).then(response => response.data),
  patch: <T>(path: string, body: unknown): Promise<T> => apiClient.patch<ApiResponse<T>>(path, body).then(response => response.data),
}
