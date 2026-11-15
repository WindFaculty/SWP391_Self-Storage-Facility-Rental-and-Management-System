import { useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import { listFacilities } from '../../features/facility/api/facilityUnitsApi'
import type { Facility } from '../../features/facility/types'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorState } from '../../components/ui/ErrorState'
import { EmptyState } from '../../components/ui/EmptyState'
import { SessionContext } from './session-context'

const EMPTY_FACILITIES: Facility[] = []

export function SessionProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | null>(null)
  const facilityRole = user?.role === 'FACILITY_MANAGER' || user?.role === 'FACILITY_STAFF'
  const facilitiesQuery = useQuery({
    queryKey: ['workspace-facilities', user?.id, user?.role, user?.facilityId],
    queryFn: listFacilities,
    enabled: isAuthenticated && user?.role !== 'CUSTOMER',
    retry: false,
  })
  const facilities = facilitiesQuery.data ?? EMPTY_FACILITIES
  const facilitiesInScope = useMemo(
    () =>
      facilityRole
        ? facilities.filter((facility) => facility.id === user?.facilityId)
        : facilities,
    [facilities, facilityRole, user?.facilityId],
  )
  const activeFacilityId = facilitiesInScope.some((facility) => facility.id === selectedFacilityId)
    ? selectedFacilityId
    : (facilitiesInScope[0]?.id ?? null)

  if (isLoading) return <LoadingSpinner text="Đang tải phiên làm việc…" />
  if (!isAuthenticated || !user) return <Navigate to="/auth" state={{ from: location }} replace />
  if (user.role === 'CUSTOMER') return <Navigate to="/forbidden" replace />
  if (facilitiesQuery.isPending) return <LoadingSpinner text="Đang tải cơ sở…" />
  if (facilitiesQuery.isError)
    return (
      <ErrorState
        title="Không tải được cơ sở"
        description="Vui lòng kiểm tra kết nối máy chủ và thử lại."
        onRetry={() => void facilitiesQuery.refetch()}
      />
    )
  if (facilityRole && !activeFacilityId)
    return (
      <EmptyState
        title="Chưa được phân công cơ sở"
        description="Liên hệ quản trị viên để được cấp quyền tại một cơ sở."
      />
    )

  return (
    <SessionContext.Provider
      value={{
        user,
        facilities,
        facilitiesInScope,
        activeFacilityId,
        setActiveFacilityId: (id) => {
          if (facilitiesInScope.some((facility) => facility.id === id)) setSelectedFacilityId(id)
        },
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}
