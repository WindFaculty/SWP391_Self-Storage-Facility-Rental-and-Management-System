import { useQuery } from '@tanstack/react-query'
import { listActivityLogs, listUsers, type UserSummary } from '../api/adminApi'
import type { LogFilters, UserFilters } from '../types'

const EMPTY_USER_SUMMARY: UserSummary = { total: 0, active: 0, disabled: 0, elevated: 0 }

export function useUsers(filters: UserFilters) {
  const query = useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: () => listUsers(filters),
  })
  return {
    users: query.data?.items ?? [],
    summary: query.data?.summary ?? EMPTY_USER_SUMMARY,
    loading: query.isPending,
    error: query.error ? 'Không tải được danh sách tài khoản. Vui lòng thử lại.' : null,
    reload: query.refetch,
  }
}

export function useActivityLogs(filters: LogFilters) {
  const query = useQuery({
    queryKey: ['admin', 'logs', filters],
    queryFn: () => listActivityLogs(filters),
  })
  return {
    logs: query.data ?? [],
    loading: query.isPending,
    error: query.error ? 'Không tải được nhật ký hoạt động. Vui lòng thử lại.' : null,
    reload: query.refetch,
  }
}
