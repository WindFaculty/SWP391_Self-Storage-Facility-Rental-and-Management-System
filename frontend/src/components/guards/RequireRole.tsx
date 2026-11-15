import type { ReactNode } from 'react'
import { useSession } from '../../app/providers/useSession'
import type { UserRole } from '../../features/facility/types'
import { EmptyState } from '../ui/EmptyState'

export function RequireRole({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const { user } = useSession()
  if (!roles.includes(user.role)) {
    return (
      <EmptyState
        icon="lock"
        title="Bạn không có quyền truy cập màn hình này."
        description="Tài khoản hiện tại không có quyền sử dụng màn hình này."
      />
    )
  }
  return <>{children}</>
}
