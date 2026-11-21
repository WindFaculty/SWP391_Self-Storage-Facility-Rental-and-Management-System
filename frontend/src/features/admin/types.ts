import type { UserRole } from '../facility/types'

export type UserStatus = 'ACTIVE' | 'DISABLED'

export type UsagePeriodDays = 7 | 14 | 30 | 90

export interface AdminUser {
  id: number
  fullName: string
  email: string
  phone: string | null
  role: UserRole
  facilityId: number | null
  status: UserStatus
  createdAt: string
}

export interface UserFilters {
  role: UserRole | null
  facilityId: number | null
  status: UserStatus | null
  search: string
}

export interface LogFilters {
  action: string | null
  search: string
}

export interface OverviewMetrics {
  totalUsers: number
  activeUsers: number
  disabledUsers: number
  newUsersInPeriod: number
  activeSessions: number
  activeSessionUsers: number
  googleLinkedUsers: number
  totalEventsInPeriod: number
  activeActorsInPeriod: number
  uniqueIpsInPeriod: number
  activeFacilities: number
  totalFacilities: number
  occupiedUnits: number
  totalUnits: number
  occupancyRate: number
}

export interface AuthMetrics {
  loginSuccessCount: number
  loginFailedCount: number
  registrationsCount: number
  adminChangesCount: number
  loginSuccessRate: number | null
}

export interface RoleUsageRow {
  role: UserRole
  total: number
  active: number
  disabled: number
  newInPeriod: number
}

export interface DailyActivityPoint {
  date: string
  label: string
  totalEvents: number
  loginSuccess: number
  loginFailed: number
  otherEvents: number
}

export interface ActionCountRow {
  action: string
  count: number
}

export interface PlatformUsageMetrics {
  totalRentals: number
  activeRentals: number
  reservedRentals: number
  pendingPaymentRentals: number
  overdueRentals: number
  returnRequestedRentals: number
  newRentalsInPeriod: number
  totalInvoices: number
  paidInvoices: number
  pendingInvoices: number
  paymentAttemptsInPeriod: number
  paymentSuccessInPeriod: number
  paymentFailedInPeriod: number
  paymentSuccessRate: number | null
  totalTickets: number
  openTickets: number
  resolvedTickets: number
  ticketsInPeriod: number
  totalTasks: number
  openTasks: number
  completedTasks: number
  uploadedImageCount: number
  totalImageCount: number
  mediaStorageBytes: number
}

export interface FacilityUsageRow {
  facilityId: number
  code: string
  name: string
  status: 'ACTIVE' | 'INACTIVE'
  staffCount: number
  unitTotal: number
  unitOccupied: number
  unitMaintenance: number
  occupancyRate: number
  activeRentals: number
  overdueRentals: number
  openTickets: number
}

export interface SecurityEventRow {
  id: number
  actorName: string | null
  action: string
  entityType: string | null
  entityId: number | null
  ipAddress: string | null
  createdAt: string | null
}

export interface SystemUsageDashboard {
  periodDays: number
  generatedAt: string
  overview: OverviewMetrics
  auth: AuthMetrics
  usersByRole: RoleUsageRow[]
  dailyActivity: DailyActivityPoint[]
  topActions: ActionCountRow[]
  platform: PlatformUsageMetrics
  facilities: FacilityUsageRow[]
  recentEvents: SecurityEventRow[]
}
