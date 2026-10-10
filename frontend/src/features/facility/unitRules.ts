import { formatCurrency } from '../../lib/format'
import type {
  PriceBand,
  StorageUnit,
  StorageUnitInput,
  UnitFilters,
  UnitStatus,
  UnitType,
} from './types'

export const UNIT_STATUS_LABELS: Record<UnitStatus, string> = {
  AVAILABLE: 'Sẵn sàng',
  OCCUPIED: 'Đang thuê',
  INSPECTION: 'Đang kiểm tra',
  MAINTENANCE: 'Bảo trì',
}

export const PRICE_BANDS: Record<PriceBand, { label: string; min: number; max: number | null }> = {
  low: { label: 'Dưới 1 triệu', min: 0, max: 1_000_000 },
  mid: { label: '1 – 2 triệu', min: 1_000_000, max: 2_000_000 },
  high: { label: 'Trên 2 triệu', min: 2_000_000, max: null },
}

const STATUS_TARGETS: Record<UnitStatus, UnitStatus[]> = {
  AVAILABLE: ['INSPECTION', 'MAINTENANCE'],
  OCCUPIED: ['INSPECTION', 'MAINTENANCE'],
  INSPECTION: ['AVAILABLE', 'MAINTENANCE'],
  MAINTENANCE: ['AVAILABLE', 'INSPECTION'],
}

export function isStatusTransitionAllowed(
  from: UnitStatus,
  to: UnitStatus,
): { allowed: boolean; reason?: string } {
  if (from === to) {
    return { allowed: false, reason: 'Trạng thái không thay đổi.' }
  }
  if (to === 'OCCUPIED') {
    return { allowed: false, reason: 'Kho chỉ chuyển sang Đang thuê qua luồng giao kho.' }
  }
  if (from === 'OCCUPIED' && to === 'AVAILABLE') {
    return {
      allowed: false,
      reason: 'Kho đang được thuê — chỉ chuyển sang kiểm tra/bảo trì theo luồng trả kho.',
    }
  }
  if (STATUS_TARGETS[from].includes(to)) {
    return { allowed: true }
  }
  return { allowed: false, reason: 'Chuyển trạng thái không hợp lệ.' }
}

export function requiresStatusReason(to: UnitStatus): boolean {
  return to === 'INSPECTION' || to === 'MAINTENANCE'
}

export function inPriceBand(price: number, band: PriceBand): boolean {
  const { min, max } = PRICE_BANDS[band]
  return price >= min && (max === null || price < max)
}

export function filterUnits(units: StorageUnit[], filters: UnitFilters): StorageUnit[] {
  const search = filters.search.trim().toLowerCase()
  return units
    .filter((unit) => unit.facilityId === filters.facilityId)
    .filter((unit) => (search ? unit.unitCode.toLowerCase().includes(search) : true))
    .filter((unit) => (filters.unitTypeId ? unit.unitTypeId === filters.unitTypeId : true))
    .filter((unit) => (filters.status ? unit.status === filters.status : true))
    .filter((unit) => (filters.priceBand ? inPriceBand(unit.monthlyPrice, filters.priceBand) : true))
    .sort((a, b) => a.unitCode.localeCompare(b.unitCode, 'vi', { numeric: true }))
}

export function validateUnitInput(
  input: StorageUnitInput,
  unitTypes: UnitType[],
  existingUnits: StorageUnit[],
  editingUnitId: number | null,
): Record<string, string> {
  const errors: Record<string, string> = {}
  const code = input.unitCode.trim()

  if (!code) {
    errors.unitCode = 'Nhập mã kho.'
  } else if (
    existingUnits.some(
      (unit) =>
        unit.facilityId === input.facilityId &&
        unit.id !== editingUnitId &&
        unit.unitCode.trim().toLowerCase() === code.toLowerCase(),
    )
  ) {
    errors.unitCode = 'Mã kho đã tồn tại trong cơ sở.'
  }

  const unitType = unitTypes.find((type) => type.id === input.unitTypeId)
  if (!unitType) {
    errors.unitTypeId = 'Chọn loại kho.'
  }

  if (!Number.isFinite(input.monthlyPrice) || input.monthlyPrice < 0) {
    errors.monthlyPrice = 'Nhập giá thuê hợp lệ.'
  } else if (
    unitType &&
    (input.monthlyPrice < unitType.minMonthlyPrice || input.monthlyPrice > unitType.maxMonthlyPrice)
  ) {
    errors.monthlyPrice = `Giá thuê phải trong khoảng ${formatCurrency(unitType.minMonthlyPrice)} – ${formatCurrency(unitType.maxMonthlyPrice)}.`
  }

  if (!input.locationLabel.trim()) {
    errors.locationLabel = 'Nhập vị trí/tầng.'
  }

  return errors
}
