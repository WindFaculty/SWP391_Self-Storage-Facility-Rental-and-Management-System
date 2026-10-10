import { formatArea, formatCurrency } from '../../../lib/format'
import type { StorageUnit, UnitType } from '../types'
import { UnitStatusLabel } from './UnitStatusLabel'

interface UnitsTableProps {
  units: StorageUnit[]
  unitTypes: UnitType[]
  onOpen: (unit: StorageUnit) => void
}

export function UnitsTable({ units, unitTypes, onOpen }: UnitsTableProps) {
  const typeById = new Map(unitTypes.map((unitType) => [unitType.id, unitType]))

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-ui-table">
        <thead>
          <tr className="bg-surface-muted text-left text-text-muted">
            <th scope="col" className="px-space-lg py-space-md font-semibold">Mã kho</th>
            <th scope="col" className="px-space-lg py-space-md font-semibold">Loại kho</th>
            <th scope="col" className="px-space-lg py-space-md font-semibold">Diện tích</th>
            <th scope="col" className="px-space-lg py-space-md font-semibold">Vị trí / Tầng</th>
            <th scope="col" className="px-space-lg py-space-md font-semibold text-right">Giá thuê niêm yết</th>
            <th scope="col" className="px-space-lg py-space-md font-semibold">Trạng thái</th>
            <th scope="col" className="px-space-lg py-space-md font-semibold text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {units.map((unit) => {
            const unitType = typeById.get(unit.unitTypeId)
            return (
              <tr
                key={unit.id}
                onClick={() => onOpen(unit)}
                className="border-b border-border-subtle last:border-b-0 hover:bg-surface-muted/60 cursor-pointer"
              >
                <td className="px-space-lg py-space-md font-medium text-text-main">{unit.unitCode}</td>
                <td className="px-space-lg py-space-md">{unitType?.name ?? '—'}</td>
                <td className="px-space-lg py-space-md">{unitType ? formatArea(unitType.sizeM2) : '—'}</td>
                <td className="px-space-lg py-space-md">{unit.locationLabel}</td>
                <td className="px-space-lg py-space-md text-right tabular-nums">
                  {formatCurrency(unit.monthlyPrice)}
                </td>
                <td className="px-space-lg py-space-md">
                  <UnitStatusLabel status={unit.status} />
                </td>
                <td className="px-space-lg py-space-md text-right">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      onOpen(unit)
                    }}
                    className="text-label-help font-medium text-primary hover:underline"
                  >
                    Chi tiết
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
