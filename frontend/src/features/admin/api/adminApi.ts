import { withQuery, workspaceClient } from '../../../api/workspaceClient'
import type { ActivityLog } from '../../facility/types'
import type { UserInput } from '../adminRules'
import type { AdminUser, LogFilters, UserFilters, UserStatus } from '../types'

export interface UserSummary { total: number; active: number; disabled: number; elevated: number }
export const listUsers = (filters: UserFilters): Promise<{ items: AdminUser[]; summary: UserSummary }> => workspaceClient.get(withQuery('/admin/users', filters))
export const createUser = (input: UserInput): Promise<AdminUser> => workspaceClient.post('/admin/users', input)
export const updateUser = (id: number, input: UserInput): Promise<AdminUser> => workspaceClient.put(`/admin/users/${id}`, input)
export const setUserStatus = (id: number, status: UserStatus): Promise<AdminUser> => workspaceClient.patch(`/admin/users/${id}/status`, { status })
export const listActivityLogs = (filters: LogFilters): Promise<ActivityLog[]> => workspaceClient.get(withQuery('/admin/activity-logs', filters))
