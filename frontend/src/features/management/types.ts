export interface BusinessPolicy {
  depositPercent: number
  renewalNoticeDays: number
  returnNoticeDays: number
  overdueGraceDays: number
  overdueFeePerDay: number
  cancellationFee: number
  maxDiscountPercent: number
  updatedAt: string | null
  updatedBy: string | null
}

export interface FeeType {
  id: number
  code: string
  name: string
  defaultAmount: number
  active: boolean
}

export interface FacilityOverview {
  id: number
  code: string
  name: string
  address: string
  status: 'ACTIVE' | 'INACTIVE'
  managerName: string | null
  unitTotal: number
  unitOccupied: number
  occupancyRate: number
  activeRentals: number
  overdueRentals: number
}

export type ReportPeriod = 'month' | 'quarter' | 'halfYear' | 'year'

export interface ReportFilters {
  period: ReportPeriod
  facilityId: number | null
}

export interface RevenuePoint {
  month: string
  label: string
  amount: number
}

export interface FacilityReportRow {
  facilityId: number
  name: string
  unitTotal: number
  unitOccupied: number
  unitAvailable: number
  occupancyRate: number
  revenue: number
  activeRentals: number
  overdueRentals: number
}

export interface ReportSummary {
  totalRevenue: number
  occupancyRate: number
  activeRentals: number
  overdueRentals: number
  revenuePoints: RevenuePoint[]
  rows: FacilityReportRow[]
}
