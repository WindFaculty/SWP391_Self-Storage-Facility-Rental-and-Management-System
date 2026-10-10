export type UnitStatus = 'AVAILABLE' | 'OCCUPIED' | 'INSPECTION' | 'MAINTENANCE'

export type PriceBand = 'low' | 'mid' | 'high'

export type UserRole =
  | 'CUSTOMER'
  | 'FACILITY_STAFF'
  | 'FACILITY_MANAGER'
  | 'BUSINESS_MANAGER'
  | 'ADMIN'

export interface Facility {
  id: number
  code: string
  name: string
  address: string
  status: 'ACTIVE' | 'INACTIVE'
}

export interface UnitType {
  id: number
  name: string
  sizeM2: number
  minMonthlyPrice: number
  maxMonthlyPrice: number
}

export interface StorageUnit {
  id: number
  facilityId: number
  unitTypeId: number
  unitCode: string
  locationLabel: string
  monthlyPrice: number
  status: UnitStatus
}

export interface StorageUnitInput {
  facilityId: number
  unitTypeId: number
  unitCode: string
  locationLabel: string
  monthlyPrice: number
}

export interface UnitFilters {
  facilityId: number
  search: string
  unitTypeId: number | null
  status: UnitStatus | null
  priceBand: PriceBand | null
}

export interface UnitSummary {
  total: number
  byStatus: Record<UnitStatus, number>
}
