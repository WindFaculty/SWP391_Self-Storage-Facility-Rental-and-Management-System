// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../../api/client'
import { createUnit } from '../../features/facility/api/facilityUnitsApi'
import { imageDrafts, imageFormData, validateImageFiles } from './images'

afterEach(() => { apiClient.clearTokens(); vi.unstubAllGlobals() })

describe('warehouse image uploads', () => {
  it('keeps ordered existing image IDs and maps new files without uploading preview URLs', async () => {
    const file = new File(['png bytes'], 'new.png', { type: 'image/png' })
    const form = imageFormData({ name: 'Test' }, [
      { key: 'new', file, url: 'blob:preview' },
      ...imageDrafts([{ id: 'old', url: '/api/v1/media/old', sortOrder: 0 }]),
    ])
    expect(form.getAll('files')).toHaveLength(1)
    expect(JSON.parse(await (form.get('data') as Blob).text())).toEqual({ name: 'Test', images: [{ fileIndex: 0 }, { id: 'old' }] })
  })

  it('passes multipart bytes through the real API client and preserves bearer authentication', async () => {
    apiClient.setToken('test-token')
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { id: 5 } })))
    vi.stubGlobal('fetch', fetchMock)
    await createUnit({ facilityId: 1, unitTypeId: 2, unitCode: 'A', locationLabel: 'Floor 1', monthlyPrice: 500,
      imageDrafts: [{ key: 'new', file: new File(['png'], 'photo.png', { type: 'image/png' }), url: 'blob:preview' }] })
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/ops/units')
    expect(options.body).toBeInstanceOf(FormData)
    expect(options.headers.has('Content-Type')).toBe(false)
    expect(options.headers.get('Authorization')).toBe('Bearer test-token')
  })

  it('sends CSRF protection for cookie-based multipart uploads', async () => {
    apiClient.setCookieSession(true)
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ data: { token: 'csrf-proof' } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] })))
    vi.stubGlobal('fetch', fetchMock)
    await apiClient.put('/ops/facilities/1/images', imageFormData({}, []))
    const options = fetchMock.mock.calls[1][1]
    expect(options.headers.get('X-XSRF-TOKEN')).toBe('csrf-proof')
    expect(options.headers.has('Content-Type')).toBe(false)
    expect(options.credentials).toBe('include')
  })

  it('rejects excess images, unsupported types, empty and oversized files', () => {
    const valid = new File(['png'], 'photo.png', { type: 'image/png' })
    expect(validateImageFiles([valid], 9)).toBeNull()
    expect(validateImageFiles([valid], 10)).toContain('10 ảnh')
    expect(validateImageFiles([new File(['svg'], 'x.svg', { type: 'image/svg+xml' })], 0)).toContain('JPEG/PNG')
    expect(validateImageFiles([new File([], 'empty.png', { type: 'image/png' })], 0)).toContain('5 MiB')
    expect(validateImageFiles([new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' })], 0)).toContain('5 MiB')
  })
})
