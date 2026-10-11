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
});
