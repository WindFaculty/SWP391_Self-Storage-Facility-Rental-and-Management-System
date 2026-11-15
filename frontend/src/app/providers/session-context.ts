import { createContext } from 'react'
import type { AuthUser } from '../../features/auth/types'
import type { Facility, UserRole } from '../../features/facility/types'

export const ROLE_LABELS: Record<UserRole, string> = {
  CUSTOMER: 'Khách hàng',
  FACILITY_STAFF: 'Nhân viên cơ sở',
  FACILITY_MANAGER: 'Quản lý cơ sở',
  BUSINESS_MANAGER: 'Quản lý kinh doanh',
  ADMIN: 'Quản trị hệ thống',
}

export interface SessionValue {
  user: AuthUser
  facilities: Facility[]
  facilitiesInScope: Facility[]
  activeFacilityId: number | null
  setActiveFacilityId: (facilityId: number) => void
}

export const SessionContext = createContext<SessionValue | null>(null)
