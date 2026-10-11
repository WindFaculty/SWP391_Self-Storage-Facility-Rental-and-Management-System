import { apiClient, type ApiResponse } from './client'

export function withQuery(path: string, values: object): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) {
    if (value !== null && value !== undefined && value !== '') query.set(key, String(value))
  }
  return query.size ? `${path}?${query}` : path
}

export const api = {
  get: <T>(path: string): Promise<T> => apiClient.get<ApiResponse<T>>(path).then((res) => res.data),
  post: <T>(path: string, body?: unknown): Promise<T> =>
    apiClient.post<ApiResponse<T>>(path, body ?? {}).then((res) => res.data),
  put: <T>(path: string, body?: unknown): Promise<T> =>
    apiClient.put<ApiResponse<T>>(path, body ?? {}).then((res) => res.data),
  patch: <T>(path: string, body?: unknown): Promise<T> =>
    apiClient.patch<ApiResponse<T>>(path, body ?? {}).then((res) => res.data),
}
