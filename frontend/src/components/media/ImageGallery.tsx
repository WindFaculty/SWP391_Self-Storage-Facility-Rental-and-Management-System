import { useState } from 'react'
import type { WarehouseImage } from './images'
import { FALLBACK_WAREHOUSE_IMAGE, handleWarehouseImageError } from '../../features/catalog/lib/catalogImages'

export function ImageGallery({ images = [], title, imageUrl }: { images?: WarehouseImage[]; title: string; imageUrl?: string | null }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = images.find(image => image.id === selectedId) ?? images[0]
  return (
    <div>
      <img src={selected?.url ?? imageUrl ?? FALLBACK_WAREHOUSE_IMAGE} alt={`Hình ảnh ${title}`}
        onError={handleWarehouseImageError} className="aspect-[16/9] w-full rounded-lg bg-surface-muted object-cover" />
      {images.length > 1 && <div className="mt-2 flex gap-2 overflow-x-auto pb-1" aria-label={`Bộ ảnh ${title}`}>
        {images.map((image, index) => <button key={image.id} type="button" aria-label={`Xem ảnh ${index + 1} của ${title}`}
          aria-pressed={image.id === selected?.id} onClick={() => setSelectedId(image.id)}
          className={`shrink-0 rounded border-2 ${image.id === selected?.id ? 'border-primary' : 'border-transparent'}`}>
          <img src={image.url} alt="" onError={handleWarehouseImageError} loading="lazy" className="h-14 w-20 rounded object-cover" />
        </button>)}
      </div>}
    </div>
  )
}
