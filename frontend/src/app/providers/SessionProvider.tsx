import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { listFacilities } from '../../features/facility/api/facilityUnitsApi'
import type { Facility, UserRole } from '../../features/facility/types'

export interface SessionUser {
  id: number
  fullName: string
  role: UserRole
  facilityId: number | null
}

interface SessionValue {
  user: SessionUser
  facilities: Facility[]
  facilitiesInScope: Facility[]
  activeFacilityId: number | null
  setActiveFacilityId: (facilityId: number) => void
}

const MOCK_USER: SessionUser = {
  id: 108,
  fullName: 'Lê Hoàng Nam',
  role: 'FACILITY_MANAGER',
  facilityId: 1,
}

const SessionContext = createContext<SessionValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [activeFacilityId, setActiveFacilityId] = useState<number | null>(MOCK_USER.facilityId)

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
    if (MOCK_USER.role === 'FACILITY_MANAGER' || MOCK_USER.role === 'FACILITY_STAFF') {
      return facilities.filter((facility) => facility.id === MOCK_USER.facilityId)
    }
    return facilities
  }, [facilities])

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
      user: MOCK_USER,
      facilities,
      facilitiesInScope,
      activeFacilityId,
      setActiveFacilityId,
    }),
    [facilities, facilitiesInScope, activeFacilityId],
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
