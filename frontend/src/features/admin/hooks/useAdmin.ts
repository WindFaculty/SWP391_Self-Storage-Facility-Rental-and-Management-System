import { useCallback, useEffect, useState } from 'react'
import { listActivityLogs, listUsers, type UserSummary } from '../api/adminApi'
import type { AdminUser, LogFilters, UserFilters } from '../types'
import type { ActivityLog } from '../../facility/types'

const EMPTY_USER_SUMMARY: UserSummary = { total: 0, active: 0, disabled: 0, elevated: 0 }

export function useUsers(filters: UserFilters) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [summary, setSummary] = useState<UserSummary>(EMPTY_USER_SUMMARY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { role, facilityId, status, search } = filters

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await listUsers({ role, facilityId, status, search })
      setUsers(result.items)
      setSummary(result.summary)
    } catch {
      setError('Không tải được danh sách tài khoản. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [role, facilityId, status, search])

  useEffect(() => {
    void reload()
  }, [reload])

  return { users, summary, loading, error, reload }
}

export function useActivityLogs(filters: LogFilters) {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { action, search } = filters

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setLogs(await listActivityLogs({ action, search }))
    } catch {
      setError('Không tải được nhật ký hoạt động. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [action, search])

  useEffect(() => {
    void reload()
  }, [reload])

  return { logs, loading, error, reload }
}
