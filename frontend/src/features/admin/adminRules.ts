import type { ActivityLog, UserRole } from '../facility/types'
import type { AdminUser, LogFilters, UserStatus } from './types'

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'Đang hoạt động',
  DISABLED: 'Đã vô hiệu hóa',
}

export const ACTION_LABELS: Record<string, string> = {
  POLICY_UPDATED: 'Cập nhật chính sách',
  FEE_UPDATED: 'Cập nhật phụ phí',
  FACILITY_CREATED: 'Tạo cơ sở',
  FACILITY_UPDATED: 'Cập nhật cơ sở',
  FACILITY_STATUS_CHANGED: 'Đổi trạng thái cơ sở',
  TASK_ASSIGNED: 'Phân công công việc',
  UNIT_STATUS_CHANGED: 'Đổi trạng thái kho',
  AUTO_OVERDUE_CHECK: 'Quét quá hạn tự động',
  USER_CREATED: 'Tạo tài khoản',
  USER_UPDATED: 'Cập nhật tài khoản',
  USER_DISABLED: 'Vô hiệu hóa tài khoản',
  USER_ENABLED: 'Khôi phục tài khoản',
}

export const ACTION_OPTIONS = Object.keys(ACTION_LABELS)

export interface UserInput {
  fullName: string
  email: string
  phone: string
  role: UserRole
  facilityId: number | null
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateUserInput(
  input: UserInput,
  existing: AdminUser[],
  editingId: number | null,
): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!input.fullName.trim()) {
    errors.fullName = 'Nhập họ và tên.'
  }
  const email = input.email.trim().toLowerCase()
  if (!email) {
    errors.email = 'Nhập email.'
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Email không hợp lệ.'
  } else if (
    existing.some((user) => user.id !== editingId && user.email.toLowerCase() === email)
  ) {
    errors.email = 'Email đã được sử dụng.'
  }
  const needsFacility = input.role === 'FACILITY_STAFF' || input.role === 'FACILITY_MANAGER'
  if (needsFacility && !input.facilityId) {
    errors.facilityId = 'Vai trò cơ sở phải được gán một cơ sở.'
  }
  if (!needsFacility && input.facilityId) {
    errors.facilityId = 'Chỉ vai trò cơ sở mới được gán cơ sở.'
  }
  return errors
}

export function canToggleUserStatus(
  actorId: number,
  target: AdminUser,
  users: AdminUser[],
): { allowed: boolean; reason?: string } {
  if (actorId === target.id) {
    return { allowed: false, reason: 'Không thể tự vô hiệu hóa tài khoản đang đăng nhập.' }
  }
  if (target.status === 'ACTIVE' && target.role === 'ADMIN') {
    const activeAdmins = users.filter((user) => user.role === 'ADMIN' && user.status === 'ACTIVE')
    if (activeAdmins.length <= 1) {
      return { allowed: false, reason: 'Không thể vô hiệu hóa quản trị viên đang hoạt động cuối cùng.' }
    }
  }
  return { allowed: true }
}

export function filterLogs(logs: ActivityLog[], filters: LogFilters): ActivityLog[] {
  const search = filters.search.trim().toLowerCase()
  return logs
    .filter((log) => (filters.action ? log.action === filters.action : true))
    .filter((log) =>
      search
        ? `${log.actorName} ${log.action} ${log.detail} ${log.entityType ?? ''}`
            .toLowerCase()
            .includes(search)
        : true,
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
