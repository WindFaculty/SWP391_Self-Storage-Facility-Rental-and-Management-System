import type { UserRole } from '../facility/types'

export type UserStatus = 'ACTIVE' | 'DISABLED'

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
