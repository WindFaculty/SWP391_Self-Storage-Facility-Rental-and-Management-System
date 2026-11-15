import { useEffect, useId, useRef, useState } from 'react'
import { type ImageDraft, validateImageFiles } from './images'

interface Props { value: ImageDraft[]; onChange: (images: ImageDraft[]) => void; disabled?: boolean; onBusyChange?: (busy: boolean) => void }

export function ImagePicker({ value, onChange, disabled = false, onBusyChange }: Props) {
  const id = useId()
  const [error, setError] = useState<string | null>(null)
  const [reading, setReading] = useState(false)
  const urls = useRef(new Set<string>())
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    const owned = urls.current
    return () => { alive.current = false; owned.forEach(url => URL.revokeObjectURL(url)); owned.clear() }
  }, [])
  useEffect(() => {
    const used = new Set(value.map(image => image.url))
    urls.current.forEach(url => { if (!used.has(url)) { URL.revokeObjectURL(url); urls.current.delete(url) } })
  }, [value])

  const select = async (files: File[], replaceIndex?: number) => {
    const validation = validateImageFiles(files, value.length - (replaceIndex === undefined ? 0 : 1))
    if (validation) { setError(validation); return }
    setError(null)
    setReading(true)
    onBusyChange?.(true)
    const added: ImageDraft[] = []
    try {
      for (const file of files) {
        const bitmap = await createImageBitmap(file)
        const pixels = bitmap.width * bitmap.height
        bitmap.close()
        if (!alive.current) return
        if (pixels > 20_000_000) throw new Error(`${file.name}: ảnh tối đa 20 megapixel.`)
        const url = URL.createObjectURL(file)
        urls.current.add(url)
        added.push({ key: crypto.randomUUID(), file, url })
      }
      onChange(replaceIndex === undefined ? [...value, ...added]
        : value.map((item, index) => index === replaceIndex ? added[0] : item))
    } catch (cause) {
      added.forEach(item => { URL.revokeObjectURL(item.url); urls.current.delete(item.url) })
      setError(cause instanceof Error ? cause.message : 'Không đọc được ảnh. Vui lòng chọn tệp khác.')
    } finally { if (alive.current) { setReading(false); onBusyChange?.(false) } }
  }

  return (
    <fieldset disabled={disabled || reading} className="mt-space-lg">
      <legend className="text-label-help font-medium text-text-main">Bộ ảnh ({value.length}/10)</legend>
      <p id={`${id}-help`} className="my-2 text-label-help text-text-muted">JPEG/PNG, tối đa 5 MiB và 20 megapixel mỗi ảnh. Ảnh đầu là ảnh đại diện.</p>
      <label htmlFor={id} className="block text-label-help text-text-main">Thêm ảnh từ máy</label>
      <input id={id} type="file" multiple accept="image/jpeg,image/png" aria-describedby={`${id}-help`}
        disabled={disabled || value.length >= 10} className="mt-2 w-full text-label-help"
        onChange={event => { const files = Array.from(event.target.files ?? []); event.target.value = ''; void select(files) }} />
      {error && <p role="alert" className="mt-2 text-label-help text-danger">{error}</p>}
      {reading && <p role="status" className="mt-2 text-label-help">Đang kiểm tra ảnh…</p>}
      <div className="mt-3 grid grid-cols-2 gap-3">
        {value.map((image, index) => (
          <div key={image.key} className="overflow-hidden rounded-lg border border-border-hairline p-2">
            <img src={image.url} alt={`Ảnh xem trước ${index + 1}`} className="aspect-[4/3] w-full rounded object-cover" />
            <p className="mt-1 text-label-help">{index === 0 ? 'Ảnh đại diện' : `Ảnh ${index + 1}`}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-label-help">
              {index > 0 && <button type="button" className="text-primary hover:underline"
                onClick={() => onChange([image, ...value.filter((_, i) => i !== index)])}>Đặt đại diện</button>}
              <label htmlFor={`${id}-${index}`} className="cursor-pointer text-primary hover:underline">Thay ảnh</label>
              <input id={`${id}-${index}`} aria-label={`Thay ảnh ${index + 1}`} type="file" accept="image/jpeg,image/png" className="sr-only"
                onChange={event => { const files = Array.from(event.target.files ?? []); event.target.value = ''; if (files.length) void select(files, index) }} />
              <button type="button" className="text-danger hover:underline" aria-label={`Xóa ảnh ${index + 1}`}
                onClick={() => onChange(value.filter((_, i) => i !== index))}>Xóa</button>
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  )
}
