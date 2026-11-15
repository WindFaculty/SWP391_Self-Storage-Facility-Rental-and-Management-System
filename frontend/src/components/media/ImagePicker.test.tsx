import { useState } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImagePicker } from './ImagePicker'
import { imageDrafts } from './images'
import { FALLBACK_WAREHOUSE_IMAGE, resolveFacilityImage } from '../../features/catalog/lib/catalogImages'

afterEach(cleanup)

it('lets the manager choose a cover and remove every existing image before saving', async () => {
  function Form() {
    const [images, setImages] = useState(() => imageDrafts([
      { id: 'one', url: '/one.png', sortOrder: 0 }, { id: 'two', url: '/two.png', sortOrder: 1 },
    ]))
    return <ImagePicker value={images} onChange={setImages} />
  }
  render(<Form />)
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Đặt đại diện' }))
  expect(screen.getAllByRole('img')[0]).toHaveAttribute('src', '/two.png')
  await user.click(screen.getByRole('button', { name: 'Xóa ảnh 1' }))
  await user.click(screen.getByRole('button', { name: 'Xóa ảnh 1' }))
  expect(screen.queryAllByRole('img')).toHaveLength(0)
})

it('releases preview object URLs when the form is canceled', async () => {
  vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 2, height: 2, close: vi.fn() }))
  const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview')
  const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  const change = vi.fn()
  const view = render(<ImagePicker value={[]} onChange={change} />)
  await userEvent.upload(screen.getByLabelText('Thêm ảnh từ máy'), new File(['png'], 'photo.png', { type: 'image/png' }))
  expect(change).toHaveBeenCalledTimes(1)
  view.unmount()
  expect(revoke).toHaveBeenCalledWith('blob:preview')
  create.mockRestore(); revoke.mockRestore(); vi.unstubAllGlobals()
})

it('does not restore a demo photo after the gallery was explicitly emptied', () => {
  expect(resolveFacilityImage({ code: 'FAC-HAN-01', name: 'Cầu Giấy', images: [], imageUrl: null })).toBe(FALLBACK_WAREHOUSE_IMAGE)
})
