import { appendActivityLog, logStore } from '../../facility/api/opsStore'
import type { ActivityLog } from '../../facility/types'
import {
  canToggleUserStatus,
  validateUserInput,
  type UserInput,
} from '../adminRules'
import type { AdminUser, LogFilters, UserFilters, UserStatus } from '../types'
import { MOCK_ADMIN_USERS } from './adminMockData'
import { filterLogs, filterUsers } from '../adminRules'

const LATENCY_MS = 150
const ACTOR_IP = '118.70.182.42'

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, LATENCY_MS))
}

const userStore: AdminUser[] = MOCK_ADMIN_USERS.map((user) => ({ ...user }))
let nextUserId = userStore.reduce((max, user) => Math.max(max, user.id), 0)

export interface UserSummary {
  total: number
  active: number
  disabled: number
  elevated: number
}

export async function listUsers(
  filters: UserFilters,
): Promise<{ items: AdminUser[]; summary: UserSummary }> {
  await delay()
  return {
    items: filterUsers(userStore, filters).map((user) => ({ ...user })),
    summary: {
      total: userStore.length,
      active: userStore.filter((user) => user.status === 'ACTIVE').length,
      disabled: userStore.filter((user) => user.status === 'DISABLED').length,
      elevated: userStore.filter((user) => user.role !== 'CUSTOMER').length,
    },
  }
}

export async function createUser(input: UserInput, actorName: string): Promise<AdminUser> {
  await delay()
  const errors = validateUserInput(input, userStore, null)
  const firstError = Object.values(errors)[0]
  if (firstError) {
    throw new Error(firstError)
  }
  nextUserId += 1
  const user: AdminUser = {
    id: nextUserId,
    fullName: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim() || null,
    role: input.role,
    facilityId: input.facilityId,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  }
  userStore.push(user)
  appendActivityLog({
    actorName,
    action: 'USER_CREATED',
    entityType: 'users',
    entityId: user.id,
    detail: `Tạo tài khoản ${user.email} (${user.role})`,
    ipAddress: ACTOR_IP,
  })
  return { ...user }
}

export async function updateUser(
  id: number,
  input: UserInput,
  actorName: string,
): Promise<AdminUser> {
  await delay()
  const user = userStore.find((item) => item.id === id)
  if (!user) {
    throw new Error('Không tìm thấy tài khoản.')
  }
  const errors = validateUserInput(input, userStore, id)
  const firstError = Object.values(errors)[0]
  if (firstError) {
    throw new Error(firstError)
  }
  user.fullName = input.fullName.trim()
  user.email = input.email.trim().toLowerCase()
  user.phone = input.phone.trim() || null
  user.role = input.role
  user.facilityId = input.facilityId
  appendActivityLog({
    actorName,
    action: 'USER_UPDATED',
    entityType: 'users',
    entityId: id,
    detail: `Cập nhật tài khoản ${user.email} — vai trò ${user.role}`,
    ipAddress: ACTOR_IP,
  })
  return { ...user }
}

export async function setUserStatus(
  id: number,
  status: UserStatus,
  actorId: number,
  actorName: string,
): Promise<AdminUser> {
  await delay()
  const user = userStore.find((item) => item.id === id)
  if (!user) {
    throw new Error('Không tìm thấy tài khoản.')
  }
  if (user.status === status) {
    throw new Error('Trạng thái tài khoản không thay đổi.')
  }
  if (status === 'DISABLED') {
    const guard = canToggleUserStatus(actorId, user, userStore)
    if (!guard.allowed) {
      throw new Error(guard.reason)
    }
  }
  user.status = status
  appendActivityLog({
    actorName,
    action: status === 'DISABLED' ? 'USER_DISABLED' : 'USER_ENABLED',
    entityType: 'users',
    entityId: id,
    detail:
      status === 'DISABLED'
        ? `Vô hiệu hóa tài khoản ${user.email}`
        : `Khôi phục tài khoản ${user.email}`,
    ipAddress: ACTOR_IP,
  })
  return { ...user }
}

export async function listActivityLogs(filters: LogFilters): Promise<ActivityLog[]> {
  await delay()
  return filterLogs(logStore, filters).map((log) => ({ ...log }))
}
