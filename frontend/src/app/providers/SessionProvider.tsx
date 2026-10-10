import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { listFacilities } from '../../features/facility/api/facilityUnitsApi'
import type { Facility, UserRole } from '../../features/facility/types'

export interface SessionUser {
  id: number
  fullName: string
  role: UserRole
  facilityId: number | null
}

export const ROLE_LABELS: Record<UserRole, string> = {
  CUSTOMER: 'Khách hàng',
  FACILITY_STAFF: 'Nhân viên cơ sở',
  FACILITY_MANAGER: 'Quản lý cơ sở',
  BUSINESS_MANAGER: 'Quản lý kinh doanh',
  ADMIN: 'Quản trị hệ thống',
}

const MOCK_USERS: Record<UserRole, SessionUser> = {
  CUSTOMER: { id: 840, fullName: 'Nguyễn Minh Quân', role: 'CUSTOMER', facilityId: null },
  FACILITY_STAFF: { id: 215, fullName: 'Vũ Thu Thảo', role: 'FACILITY_STAFF', facilityId: 1 },
  FACILITY_MANAGER: { id: 108, fullName: 'Lê Hoàng Nam', role: 'FACILITY_MANAGER', facilityId: 1 },
  BUSINESS_MANAGER: { id: 42, fullName: 'Lê Phương Mai', role: 'BUSINESS_MANAGER', facilityId: null },
  ADMIN: { id: 1, fullName: 'Trần Hoàng Nam', role: 'ADMIN', facilityId: null },
}

export const DEMO_ROLES: UserRole[] = [
  'FACILITY_STAFF',
  'FACILITY_MANAGER',
  'BUSINESS_MANAGER',
  'ADMIN',
]

interface SessionValue {
  user: SessionUser
  role: UserRole
  setRole: (role: UserRole) => void
  facilities: Facility[]
  facilitiesInScope: Facility[]
  activeFacilityId: number | null
  setActiveFacilityId: (facilityId: number) => void
}

const SessionContext = createContext<SessionValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>('FACILITY_MANAGER')
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [activeFacilityId, setActiveFacilityId] = useState<number | null>(MOCK_USERS.FACILITY_MANAGER.facilityId)

  const user = MOCK_USERS[role]

  useEffect(() => {
    let cancelled = false
    void listFacilities().then((items) => {
      if (!cancelled) {
        setFacilities(items)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const facilitiesInScope = useMemo(() => {
    if (user.role === 'FACILITY_MANAGER' || user.role === 'FACILITY_STAFF') {
      return facilities.filter((facility) => facility.id === user.facilityId)
    }
    return facilities.filter((facility) => facility.status === 'ACTIVE')
  }, [facilities, user])

  useEffect(() => {
    if (
      facilitiesInScope.length > 0 &&
      !facilitiesInScope.some((facility) => facility.id === activeFacilityId)
    ) {
      setActiveFacilityId(facilitiesInScope[0].id)
    }
  }, [facilitiesInScope, activeFacilityId])

  const value = useMemo(
    () => ({
      user,
      role,
      setRole,
      facilities,
      facilitiesInScope,
      activeFacilityId,
      setActiveFacilityId,
    }),
    [user, role, facilities, facilitiesInScope, activeFacilityId],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionValue {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within SessionProvider')
  }
  return context
}
