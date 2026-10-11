import { api, withQuery } from '../../../api/api'
import type { ActivityLog } from '../../facility/types'
import type { UserInput } from '../adminRules'
import type { AdminUser, LogFilters, UserFilters, UserStatus } from '../types'

export interface UserSummary { total: number; active: number; disabled: number; elevated: number }
export const listUsers = (filters: UserFilters): Promise<{ items: AdminUser[]; summary: UserSummary }> => api.get(withQuery('/admin/users', filters))
export const createUser = (input: UserInput): Promise<AdminUser> => api.post('/admin/users', input)
export const updateUser = (id: number, input: UserInput): Promise<AdminUser> => api.put(`/admin/users/${id}`, input)
export const setUserStatus = (id: number, status: UserStatus): Promise<AdminUser> => api.patch(`/admin/users/${id}/status`, { status })
export const listActivityLogs = (filters: LogFilters): Promise<ActivityLog[]> => api.get(withQuery('/admin/activity-logs', filters))
