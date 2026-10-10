import { createBrowserRouter, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { EmptyState } from '../../components/ui/EmptyState'
import { FacilityUnitsPage } from '../../features/facility/pages/FacilityUnitsPage'
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
        description="Liên hệ quản trị hệ thống nếu bạn cần được cấp quyền."
      />
    )
  }
  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <WorkspaceLayout />,
    children: [
      { index: true, element: <Navigate to="/facility/units" replace /> },
      {
        path: 'facility/units',
        element: (
          <RequireRole roles={['FACILITY_MANAGER']}>
            <FacilityUnitsPage />
          </RequireRole>
        ),
      },
      { path: 'facility/dashboard', element: <NotBuiltPage title="Tổng quan cơ sở" /> },
      { path: 'facility/rentals', element: <NotBuiltPage title="Hợp đồng & Phân công" /> },
      { path: 'staff/operations', element: <NotBuiltPage title="Công việc tại cơ sở" /> },
      { path: 'operations/facilities', element: <NotBuiltPage title="Mạng lưới cơ sở" /> },
      { path: 'operations/policies', element: <NotBuiltPage title="Chính sách & Bảng phí" /> },
      { path: 'operations/reports', element: <NotBuiltPage title="Báo cáo toàn mạng" /> },
      { path: 'admin/security', element: <NotBuiltPage title="Quản trị & Bảo mật" /> },
      { path: '*', element: <NotBuiltPage title="Không tìm thấy trang" /> },
    ],
  },
])
