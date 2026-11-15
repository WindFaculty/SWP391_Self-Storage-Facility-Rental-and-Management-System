import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ImageGallery } from '../../../components/media/ImageGallery'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { ErrorState } from '../../../components/ui/ErrorState'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { formatArea } from '../../../lib/format'
import { catalogApi } from '../api/catalogApi'
import type { UnitType } from '../types'

export function FacilityUnitGallery({ facilityId, unitTypes }: { facilityId: string; unitTypes: UnitType[] }) {
  const [page, setPage] = useState(0)
  const [typeId, setTypeId] = useState('')
  const query = useQuery({ queryKey: ['catalog', 'unit-images', facilityId, typeId, page],
    queryFn: () => catalogApi.listFacilityUnits(facilityId, page, typeId) })
  return <section className="border-t border-border-hairline py-8">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div><h2 className="text-subsection text-text-main">Ảnh từng kho</h2>
        <p className="mt-2 text-table text-text-muted">Tham khảo hình ảnh các kho tại cơ sở. Đặt chỗ theo loại kho ở phía trên.</p></div>
      <label className="text-label-help">Lọc loại kho
        <select value={typeId} onChange={event => { setTypeId(event.target.value); setPage(0) }}
          className="ml-2 rounded border border-border-hairline bg-surface p-2">
          <option value="">Tất cả loại kho</option>
          {unitTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
        </select>
      </label>
    </div>
    {query.isPending ? <LoadingSpinner text="Đang tải ảnh các kho…" /> : query.isError
      ? <ErrorState title="Không tải được ảnh các kho" onRetry={() => query.refetch()} />
      : !query.data.content.length ? <EmptyState title="Chưa có kho phù hợp" />
      : <>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {query.data.content.map(unit => <article key={unit.id} className="rounded-lg border border-border-hairline bg-surface p-3">
            <ImageGallery images={unit.images} imageUrl={unit.imageUrl} title={`kho ${unit.unitCode}`} />
            <h3 className="mt-3 text-subsection text-text-main">Kho {unit.unitCode}</h3>
            <p className="mt-1 text-table text-text-muted">{unit.unitTypeName} · {formatArea(unit.sizeM2)}</p>
          </article>)}
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-label-help text-text-muted">{query.data.totalElements} kho · Trang {page + 1}/{query.data.totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Trang trước</Button>
            <Button variant="outline" disabled={page + 1 >= query.data.totalPages} onClick={() => setPage(page + 1)}>Trang sau</Button>
          </div>
        </div>
      </>}
  </section>
}
