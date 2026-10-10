import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSession } from '../../../app/providers/SessionProvider'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { formatNumber } from '../../../lib/format'
import { changeUnitStatus, createUnit, updateUnit } from '../api/facilityUnitsApi'
import { UnitDrawer } from '../components/UnitDrawer'
import { UnitFormModal } from '../components/UnitFormModal'
import { UnitsTable } from '../components/UnitsTable'
import { UnitsToolbar } from '../components/UnitsToolbar'
import { useFacilityUnits } from '../hooks/useFacilityUnits'
import { useUnitTypes } from '../hooks/useUnitTypes'
import { PRICE_BANDS, UNIT_STATUS_LABELS } from '../unitRules'
import type { PriceBand, StorageUnit, StorageUnitInput, UnitFilters, UnitStatus } from '../types'

const PAGE_SIZE = 8

type FilterKey = 'q' | 'type' | 'status' | 'price'

type ModalState = { mode: 'create' } | { mode: 'edit'; unit: StorageUnit }

export function FacilityUnitsPage() {
  const { user, activeFacilityId, facilitiesInScope } = useSession()
  const { unitTypes } = useUnitTypes()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedUnit, setSelectedUnit] = useState<StorageUnit | null>(null)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [page, setPage] = useState(1)
  const [notice, setNotice] = useState<string | null>(null)

  const facilityId = activeFacilityId ?? 0
  const facility = facilitiesInScope.find((item) => item.id === facilityId)
  const canManage = user.role === 'FACILITY_MANAGER'

  const filters: UnitFilters = useMemo(() => {
    const statusParam = searchParams.get('status')
    const priceParam = searchParams.get('price')
    const typeParam = searchParams.get('type')
    return {
      facilityId,
      search: searchParams.get('q') ?? '',
      unitTypeId: typeParam ? Number(typeParam) : null,
      status: statusParam && statusParam in UNIT_STATUS_LABELS ? (statusParam as UnitStatus) : null,
      priceBand: priceParam && priceParam in PRICE_BANDS ? (priceParam as PriceBand) : null,
    }
  }, [facilityId, searchParams])

  const { units, summary, loading, error, reload } = useFacilityUnits(filters)

  const hasActiveFilters = Boolean(
    filters.search || filters.unitTypeId || filters.status || filters.priceBand,
  )

  const setFilter = (key: FilterKey, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    setSearchParams(next, { replace: true })
    setPage(1)
  }

  const resetFilters = () => {
    setSearchParams({}, { replace: true })
    setPage(1)
  }

  const handleStatusChange = async (unit: StorageUnit, to: UnitStatus, reason?: string) => {
    const updated = await changeUnitStatus(unit.id, to, reason)
    setSelectedUnit(updated)
    setNotice(`Đã cập nhật kho ${updated.unitCode}: ${UNIT_STATUS_LABELS[to]}.`)
    await reload()
  }

  const handleSubmit = async (input: StorageUnitInput) => {
    if (modal?.mode === 'edit') {
      const updated = await updateUnit(modal.unit.id, input)
      setSelectedUnit(updated)
      setNotice(`Đã lưu thay đổi kho ${updated.unitCode}.`)
    } else {
      const created = await createUnit(input)
      setNotice(`Đã thêm kho ${created.unitCode}.`)
    }
    setModal(null)
    await reload()
  }

  const totalPages = Math.max(1, Math.ceil(units.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = units.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const kpis = [
    { label: 'Tổng số kho', value: summary.total },
    { label: 'Đang thuê', value: summary.byStatus.OCCUPIED },
    { label: 'Sẵn sàng', value: summary.byStatus.AVAILABLE },
    { label: 'Kiểm tra & Bảo trì', value: summary.byStatus.INSPECTION + summary.byStatus.MAINTENANCE },
  ]

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
        <div>
          <p className="text-badge-caption uppercase tracking-wider text-text-muted">Cơ sở vận hành</p>
          <h1 className="mt-1 text-page-title text-text-main">
            Quản lý kho lưu trữ{facility ? ` — ${facility.name}` : ''}
          </h1>
          <p className="mt-space-xs text-body-default text-text-muted">
            {formatNumber(summary.total)} kho vật lý tại cơ sở • Hiển thị {formatNumber(units.length)} theo
            bộ lọc hiện tại
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setModal({ mode: 'create' })}>
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              add
            </span>
            Thêm kho mới
          </Button>
        )}
      </div>

      {notice && (
        <div
          role="status"
          className="mt-space-lg flex items-center justify-between gap-space-md rounded-lg bg-success-bg px-space-lg py-space-md text-label-help text-success"
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              check_circle
            </span>
            {notice}
          </span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Đóng thông báo"
            className="hover:opacity-70"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      <div className="mt-space-lg grid grid-cols-2 xl:grid-cols-4 gap-space-md">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-surface rounded-xl border border-border-hairline p-space-xl">
            <p className="text-label-help text-text-muted">{kpi.label}</p>
            <p className="mt-1 text-kpi-metric text-text-main tabular-nums">{formatNumber(kpi.value)}</p>
          </div>
        ))}
      </div>

      <div className="mt-space-lg">
        <UnitsToolbar
          filters={filters}
          unitTypes={unitTypes}
          canReset={hasActiveFilters}
          onChange={setFilter}
          onReset={resetFilters}
        />
      </div>

      <div className="mt-space-lg bg-surface rounded-xl border border-border-hairline overflow-hidden">
        {error ? (
          <div className="p-space-xl text-center">
            <p role="alert" className="text-body-default text-danger">
              {error}
            </p>
            <Button variant="outline" className="mt-space-md" onClick={() => void reload()}>
              Thử lại
            </Button>
          </div>
        ) : loading ? (
          <div className="p-space-lg space-y-3" role="status">
            <span className="sr-only">Đang tải danh sách kho…</span>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-12 rounded-lg bg-surface-muted animate-pulse" />
            ))}
          </div>
        ) : units.length === 0 ? (
          summary.total === 0 ? (
            <EmptyState
              title="Chưa có kho nào ở cơ sở này."
              description="Thêm kho đầu tiên để bắt đầu quản lý tồn kho của cơ sở."
              action={
                canManage ? (
                  <Button onClick={() => setModal({ mode: 'create' })}>Thêm kho</Button>
                ) : undefined
              }
            />
          ) : (
            <EmptyState
              icon="search_off"
              title="Không có kho khớp bộ lọc."
              description="Thử đổi từ khóa tìm kiếm hoặc xóa bộ lọc."
              action={
                <Button variant="outline" onClick={resetFilters}>
                  Xóa bộ lọc
                </Button>
              }
            />
          )
        ) : (
          <>
            <UnitsTable units={pageItems} unitTypes={unitTypes} onOpen={setSelectedUnit} />
            <div className="flex items-center justify-between gap-space-md px-space-lg py-space-md border-t border-border-hairline">
              <p className="text-label-help text-text-muted">
                Hiển thị {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, units.length)} trên {formatNumber(units.length)} kho
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  compact
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  Trước
                </Button>
                <span className="text-label-help text-text-muted">
                  Trang {currentPage}/{totalPages}
                </span>
                <Button
                  variant="outline"
                  compact
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedUnit && (
        <UnitDrawer
          unit={selectedUnit}
          unitType={unitTypes.find((unitType) => unitType.id === selectedUnit.unitTypeId)}
          onClose={() => setSelectedUnit(null)}
          onEdit={() => setModal({ mode: 'edit', unit: selectedUnit })}
          onStatusChange={(to, reason) => handleStatusChange(selectedUnit, to, reason)}
        />
      )}

      {modal && (
        <UnitFormModal
          unit={modal.mode === 'edit' ? modal.unit : undefined}
          facilityId={filters.facilityId}
          unitTypes={unitTypes}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}
