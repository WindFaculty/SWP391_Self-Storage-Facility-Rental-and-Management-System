import { createBrowserRouter, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AdminSecurityPage } from '../../features/admin/pages/AdminSecurityPage'
import { EmptyState } from '../../components/ui/EmptyState'
import { FacilityDashboardPage } from '../../features/facility/pages/FacilityDashboardPage'
import { FacilityRentalsPage } from '../../features/facility/pages/FacilityRentalsPage'
import { FacilityUnitsPage } from '../../features/facility/pages/FacilityUnitsPage'
import { OperationsFacilitiesPage } from '../../features/management/pages/OperationsFacilitiesPage'
import { OperationsPoliciesPage } from '../../features/management/pages/OperationsPoliciesPage'
import { OperationsReportsPage } from '../../features/management/pages/OperationsReportsPage'
import { StaffOperationsPage } from '../../features/staff/pages/StaffOperationsPage'
import type { UserRole } from '../../features/facility/types'
import { WorkspaceLayout } from '../../layouts/WorkspaceLayout'
import { useSession } from '../providers/SessionProvider'
import { NotBuiltPage } from './NotBuiltPage'

function RequireRole({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const { user } = useSession()
  if (!roles.includes(user.role)) {
    return (
      <EmptyState
        icon="lock"
        title="Bạn không có quyền truy cập màn hình này."
        description="Chuyển vai trò demo ở thanh bên trái để xem màn hình tương ứng."
      />
    )
  }
  return <>{children}</>
}

const HOME_BY_ROLE: Record<UserRole, string> = {
  CUSTOMER: '/facility/dashboard',
  FACILITY_STAFF: '/staff/operations',
  FACILITY_MANAGER: '/facility/dashboard',
  BUSINESS_MANAGER: '/operations/reports',
  ADMIN: '/admin/security',
}

function HomeRedirect() {
  const { user } = useSession()
  return <Navigate to={HOME_BY_ROLE[user.role]} replace />
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <WorkspaceLayout />,
    children: [
      { index: true, element: <HomeRedirect /> },
      {
        path: 'facility/dashboard',
        element: (
          <RequireRole roles={['FACILITY_MANAGER']}>
            <FacilityDashboardPage />
          </RequireRole>
        ),
      },
      {
        path: 'facility/units',
        element: (
          <RequireRole roles={['FACILITY_MANAGER']}>
            <FacilityUnitsPage />
          </RequireRole>
        ),
      },
      {
        path: 'facility/rentals',
        element: (
          <RequireRole roles={['FACILITY_MANAGER']}>
            <FacilityRentalsPage />
          </RequireRole>
        ),
      },
      {
        path: 'staff/operations',
        element: (
          <RequireRole roles={['FACILITY_STAFF', 'FACILITY_MANAGER']}>
            <StaffOperationsPage />
          </RequireRole>
        ),
      },
      {
        path: 'operations/facilities',
        element: (
          <RequireRole roles={['BUSINESS_MANAGER']}>
            <OperationsFacilitiesPage />
          </RequireRole>
        ),
      },
      {
        path: 'operations/policies',
        element: (
          <RequireRole roles={['BUSINESS_MANAGER']}>
            <OperationsPoliciesPage />
          </RequireRole>
        ),
      },
      {
        path: 'operations/reports',
        element: (
          <RequireRole roles={['BUSINESS_MANAGER']}>
            <OperationsReportsPage />
          </RequireRole>
        ),
      },
      {
        path: 'admin/security',
        element: (
          <RequireRole roles={['ADMIN']}>
            <AdminSecurityPage />
          </RequireRole>
        ),
      },
      { path: '*', element: <NotBuiltPage title="Không tìm thấy trang" /> },
    ],
  },
])
