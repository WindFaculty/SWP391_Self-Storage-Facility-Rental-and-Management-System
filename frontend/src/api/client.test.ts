// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiClient } from './client';

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('apiClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    apiClient.clearTokens();
  });

  it('returns parsed payload on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, { data: { ok: true } })));

    const result = await apiClient.get<{ data: { ok: boolean } }>('/health');

    expect(result.data.ok).toBe(true);
  });

  it('sends bearer token when set', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, {}));
    vi.stubGlobal('fetch', fetchMock);
    apiClient.setToken('abc');

    await apiClient.get('/auth/me');

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(url).toContain('/auth/me');
    expect(headers.get('Authorization')).toBe('Bearer abc');
  });

  it('throws ApiError with backend message on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(409, { error: { code: 'OVERLAP', message: 'Kho đã được đặt' } }),
      ),
    );

    await expect(apiClient.post('/holds', {})).rejects.toMatchObject({
      status: 409,
      code: 'OVERLAP',
      message: 'Kho đã được đặt',
    });
  });

  it('clears tokens on 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401, {})));
    apiClient.setToken('abc');

    await expect(apiClient.get('/auth/me')).rejects.toBeInstanceOf(ApiError);

    expect(apiClient.getToken()).toBeNull();
  });

  it('includes credentials and sends the server CSRF token for cookie mutations', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(200, { data: { token: 'csrf-proof' } }))
      .mockResolvedValueOnce(jsonResponse(200, { data: { user: {} } }));
    vi.stubGlobal('fetch', fetchMock);
    await apiClient.post('/auth/cookie/login', { email: 'customer@example.com', password: 'password' });
    expect(fetchMock.mock.calls[0][0]).toContain('/auth/cookie/csrf');
    const init = fetchMock.mock.calls[1][1] as RequestInit;
    expect(init.credentials).toBe('include');
    expect(new Headers(init.headers).get('X-XSRF-TOKEN')).toBe('csrf-proof');
    expect(new Headers(init.headers).has('Authorization')).toBe(false);
  });

  it('restores an expired access cookie using refresh and retries the protected API once', async () => {
    apiClient.setCookieSession(true);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(401, {}))
      .mockResolvedValueOnce(jsonResponse(200, { data: { token: 'csrf-proof' } }))
      .mockResolvedValueOnce(jsonResponse(200, { data: { user: {} } }))
      .mockResolvedValueOnce(jsonResponse(200, { data: { id: 'customer' } }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await apiClient.get('/rentals')).toEqual({ data: { id: 'customer' } });
    expect(fetchMock.mock.calls.map(call => call[0])).toEqual([
      '/api/v1/rentals', '/api/v1/auth/cookie/csrf', '/api/v1/auth/cookie/refresh', '/api/v1/rentals',
    ]);
    expect(apiClient.getToken()).toBeNull();
  });

  it('stops retrying when the refreshed session is still unauthorized', async () => {
    apiClient.setCookieSession(true);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(401, {}))
      .mockResolvedValueOnce(jsonResponse(200, { data: { token: 'csrf-proof' } }))
      .mockResolvedValueOnce(jsonResponse(200, { data: {} }))
      .mockResolvedValueOnce(jsonResponse(401, {}));
    vi.stubGlobal('fetch', fetchMock);
    await expect(apiClient.get('/rentals')).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('preserves the refreshed cookie session when the retried API returns forbidden', async () => {
    apiClient.setCookieSession(true);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(401, {}))
      .mockResolvedValueOnce(jsonResponse(200, { data: { token: 'csrf-proof' } }))
      .mockResolvedValueOnce(jsonResponse(200, { data: {} }))
      .mockResolvedValueOnce(jsonResponse(403, { error: { code: 'FORBIDDEN', message: 'Access denied' } }))
      .mockResolvedValueOnce(jsonResponse(200, { data: { token: 'next-proof' } }))
      .mockResolvedValueOnce(jsonResponse(200, {}));
    vi.stubGlobal('fetch', fetchMock);
    await expect(apiClient.get('/admin/users')).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
    await apiClient.post('/customer/action', {});
    expect(fetchMock.mock.calls[4][0]).toBe('/api/v1/auth/cookie/csrf');
    expect(new Headers(fetchMock.mock.calls[5][1].headers).get('X-XSRF-TOKEN')).toBe('next-proof');
  });
});
