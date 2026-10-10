import type { Facility, StorageUnit, UnitStatus, UnitType } from '../types'

export const MOCK_FACILITIES: Facility[] = [
  {
    id: 1,
    code: 'CS-HN-CG01',
    name: 'Cơ sở Cầu Giấy — Zone B',
    address: '12 Khúc Thừa Dụ, Cầu Giấy, Hà Nội',
    status: 'ACTIVE',
  },
  {
    id: 2,
    code: 'CS-HCM-Q701',
    name: 'Cơ sở Q7 — Riverside',
    address: '88 Nguyễn Văn Linh, Quận 7, TP.HCM',
    status: 'ACTIVE',
  },
  {
    id: 3,
    code: 'CS-HCM-BT02',
    name: 'Cơ sở Bình Thạnh — Central Hub',
    address: '45 Điện Biên Phủ, Bình Thạnh, TP.HCM',
    status: 'ACTIVE',
  },
  {
    id: 4,
    code: 'CS-HN-DD03',
    name: 'Cơ sở Đống Đa — Trúc Bạch',
    address: '9 Trúc Bạch, Đống Đa, Hà Nội',
    status: 'ACTIVE',
  },
]

export const MOCK_UNIT_TYPES: UnitType[] = [
  { id: 1, name: 'Locker', sizeM2: 2, minMonthlyPrice: 500_000, maxMonthlyPrice: 900_000 },
  { id: 2, name: 'Studio Unit', sizeM2: 5, minMonthlyPrice: 1_200_000, maxMonthlyPrice: 1_800_000 },
  { id: 3, name: 'Home Suite', sizeM2: 12, minMonthlyPrice: 2_200_000, maxMonthlyPrice: 3_200_000 },
]

const STATUS_CYCLE: UnitStatus[] = [
  'AVAILABLE',
  'OCCUPIED',
  'AVAILABLE',
  'OCCUPIED',
  'AVAILABLE',
  'INSPECTION',
  'OCCUPIED',
  'AVAILABLE',
  'MAINTENANCE',
  'OCCUPIED',
]

let idSequence = 0

function buildUnits(facilityId: number, count: number): StorageUnit[] {
  const units: StorageUnit[] = []
  for (let index = 1; index <= count; index += 1) {
    const unitType = MOCK_UNIT_TYPES[(index + facilityId) % MOCK_UNIT_TYPES.length]
    const status = STATUS_CYCLE[(index + facilityId) % STATUS_CYCLE.length]
    const priceOffset = ((index * 37) % 5) * 10_000
    const price = Math.round((unitType.minMonthlyPrice + priceOffset) / 10_000) * 10_000
    idSequence += 1
    units.push({
      id: idSequence,
      facilityId,
      unitTypeId: unitType.id,
      unitCode: `#${String(index).padStart(2, '0')}`,
      locationLabel: `Tầng ${((index - 1) % 4) + 1}`,
      monthlyPrice: Math.min(price, unitType.maxMonthlyPrice),
      status,
    })
  }
  return units
}

export const MOCK_STORAGE_UNITS: StorageUnit[] = [
  ...buildUnits(1, 26),
  ...buildUnits(2, 18),
  ...buildUnits(3, 14),
  ...buildUnits(4, 10),
]
