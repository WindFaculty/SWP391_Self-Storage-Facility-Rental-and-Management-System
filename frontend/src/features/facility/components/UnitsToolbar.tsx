import { Button } from '../../../components/ui/Button'
import { PRICE_BANDS, UNIT_STATUS_LABELS } from '../unitRules'
import type { PriceBand, UnitFilters, UnitStatus, UnitType } from '../types'

const CONTROL_CLASS =
  'h-11 rounded-lg border border-border-hairline bg-surface px-space-md text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring'

const STATUS_OPTIONS: UnitStatus[] = ['AVAILABLE', 'OCCUPIED', 'INSPECTION', 'MAINTENANCE']
const PRICE_OPTIONS: PriceBand[] = ['low', 'mid', 'high']

type FilterKey = 'q' | 'type' | 'status' | 'price'

interface UnitsToolbarProps {
  filters: UnitFilters
  unitTypes: UnitType[]
  canReset: boolean
  onChange: (key: FilterKey, value: string) => void
  onReset: () => void
}

export function UnitsToolbar({ filters, unitTypes, canReset, onChange, onReset }: UnitsToolbarProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-space-md p-space-lg bg-surface rounded-xl border border-border-hairline">
      <div className="relative flex-1 min-w-[220px]">
        <label htmlFor="unit-search" className="sr-only">
          Tìm mã kho
        </label>
        <span
          className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-text-muted"
          aria-hidden="true"
        >
          search
        </span>
        <input
          id="unit-search"
          type="search"
          value={filters.search}
          onChange={(event) => onChange('q', event.target.value)}
          placeholder="Tìm mã kho (ví dụ: #24)"
          className={`${CONTROL_CLASS} w-full pl-10`}
        />
      </div>

      <label htmlFor="unit-type-filter" className="sr-only">
        Loại kho
      </label>
      <select
        id="unit-type-filter"
        value={filters.unitTypeId ?? ''}
        onChange={(event) => onChange('type', event.target.value)}
        className={`${CONTROL_CLASS} w-full lg:w-[190px]`}
      >
        <option value="">Tất cả loại kho</option>
        {unitTypes.map((unitType) => (
          <option key={unitType.id} value={unitType.id}>
            {unitType.name}
          </option>
        ))}
      </select>

      <label htmlFor="unit-status-filter" className="sr-only">
        Trạng thái
      </label>
      <select
        id="unit-status-filter"
        value={filters.status ?? ''}
        onChange={(event) => onChange('status', event.target.value)}
        className={`${CONTROL_CLASS} w-full lg:w-[180px]`}
      >
        <option value="">Tất cả trạng thái</option>
        {STATUS_OPTIONS.map((status) => (
          <option key={status} value={status}>
            {UNIT_STATUS_LABELS[status]}
          </option>
        ))}
      </select>

      <label htmlFor="unit-price-filter" className="sr-only">
        Khoảng giá
      </label>
      <select
        id="unit-price-filter"
        value={filters.priceBand ?? ''}
        onChange={(event) => onChange('price', event.target.value)}
        className={`${CONTROL_CLASS} w-full lg:w-[170px]`}
      >
        <option value="">Mọi mức giá</option>
        {PRICE_OPTIONS.map((band) => (
          <option key={band} value={band}>
            {PRICE_BANDS[band].label}
          </option>
        ))}
      </select>

      <Button variant="outline" onClick={onReset} disabled={!canReset} className="shrink-0">
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
          filter_alt_off
        </span>
        Xóa bộ lọc
      </Button>
    </div>
  )
}
