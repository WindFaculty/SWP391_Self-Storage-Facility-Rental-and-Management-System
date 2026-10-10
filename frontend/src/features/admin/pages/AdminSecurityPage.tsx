import { useMemo, useState } from 'react'
import { ROLE_LABELS, useSession } from '../../../app/providers/SessionProvider'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Modal } from '../../../components/ui/Modal'
import { Tabs } from '../../../components/ui/Tabs'
import { formatDateTime, formatNumber } from '../../../lib/format'
import type { UserRole } from '../../facility/types'
import { createUser, setUserStatus, updateUser } from '../api/adminApi'
import {
  ACTION_LABELS,
  ACTION_OPTIONS,
  canToggleUserStatus,
  USER_STATUS_LABELS,
  validateUserInput,
  type UserInput,
} from '../adminRules'
import { useActivityLogs, useUsers } from '../hooks/useAdmin'
import type { AdminUser, LogFilters, UserFilters, UserStatus } from '../types'

type TabId = 'users' | 'logs'

const ROLE_OPTIONS: UserRole[] = [
  'CUSTOMER',
  'FACILITY_STAFF',
  'FACILITY_MANAGER',
  'BUSINESS_MANAGER',
  'ADMIN',
]

const INPUT_CLASS =
  'mt-space-xs w-full h-11 rounded-lg border border-border-hairline bg-surface px-space-md text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring'

export function AdminSecurityPage() {
  const { user: sessionUser, facilities } = useSession()
  const [tab, setTab] = useState<TabId>('users')

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [facilityFilter, setFacilityFilter] = useState<number | ''>('')
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('')

  const userFilters: UserFilters = useMemo(
    () => ({
      role: roleFilter || null,
      facilityId: facilityFilter ? Number(facilityFilter) : null,
      status: statusFilter || null,
      search,
    }),
    [roleFilter, facilityFilter, statusFilter, search],
  )

  const { users, summary, loading, error, reload } = useUsers(userFilters)

  const [logAction, setLogAction] = useState('')
  const [logSearch, setLogSearch] = useState('')
  const logFilters: LogFilters = useMemo(
    () => ({ action: logAction || null, search: logSearch }),
    [logAction, logSearch],
  )
  const { logs, loading: logsLoading, error: logsError, reload: reloadLogs } = useActivityLogs(logFilters)

  const [formUser, setFormUser] = useState<AdminUser | 'create' | null>(null)
  const [toggleTarget, setToggleTarget] = useState<AdminUser | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const facilityName = (facilityId: number | null) =>
    facilityId ? facilities.find((facility) => facility.id === facilityId)?.name ?? `#${facilityId}` : '—'

  const handleToggleStatus = async () => {
    if (!toggleTarget) {
      return
    }
    const nextStatus: UserStatus = toggleTarget.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
    setBusy(true)
    setActionError(null)
    try {
      await setUserStatus(toggleTarget.id, nextStatus, sessionUser.id, sessionUser.fullName)
      setNotice(
        nextStatus === 'DISABLED'
          ? `Đã vô hiệu hóa tài khoản ${toggleTarget.email}.`
          : `Đã khôi phục tài khoản ${toggleTarget.email}.`,
      )
      setToggleTarget(null)
      await reload()
      await reloadLogs()
    } catch (toggleError) {
      setActionError(toggleError instanceof Error ? toggleError.message : 'Không đổi được trạng thái.')
    } finally {
      setBusy(false)
    }
  }

  const kpis = [
    { label: 'Tổng tài khoản', value: summary.total },
    { label: 'Đang hoạt động', value: summary.active },
    { label: 'Vô hiệu hóa', value: summary.disabled },
    { label: 'Quản trị & Vận hành', value: summary.elevated },
  ]

  return (
    <div>
      <div>
        <p className="text-badge-caption uppercase tracking-wider text-text-muted">Quản trị hệ thống</p>
        <h1 className="mt-1 text-page-title text-text-main">Quản trị tài khoản & Nhật ký</h1>
        <p className="mt-space-xs text-body-default text-text-muted">
          Quản lý truy cập theo mô hình một vai trò chính + phạm vi cơ sở, và truy vết hoạt động hệ
          thống.
        </p>
      </div>

      {notice && (
        <div
          role="status"
          className="mt-space-lg flex items-center justify-between gap-space-md rounded-lg bg-success-bg px-space-lg py-space-md text-label-help text-success"
        >
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Đóng thông báo" className="hover:opacity-70">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      <div className="mt-space-lg">
        <Tabs
          items={[
            { id: 'users', label: 'Tài khoản', count: summary.total },
            { id: 'logs', label: 'Nhật ký hoạt động' },
          ]}
          active={tab}
          onChange={(id) => setTab(id as TabId)}
        />
      </div>

      {tab === 'users' && (
        <>
          <div className="mt-space-lg grid grid-cols-2 xl:grid-cols-4 gap-space-md">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="bg-surface rounded-xl border border-border-hairline p-space-xl">
                <p className="text-label-help text-text-muted">{kpi.label}</p>
                <p className="mt-1 text-kpi-metric text-text-main tabular-nums">{formatNumber(kpi.value)}</p>
              </div>
            ))}
          </div>

          <div className="mt-space-lg flex flex-col lg:flex-row lg:items-center gap-space-md flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <label htmlFor="user-search" className="sr-only">
                Tìm tài khoản
              </label>
              <span
                className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-text-muted"
                aria-hidden="true"
              >
                search
              </span>
              <input
                id="user-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo tên hoặc email…"
                className="w-full h-11 rounded-lg border border-border-hairline bg-surface pl-10 pr-space-md text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring"
              />
            </div>
            <label htmlFor="user-role-filter" className="sr-only">
              Vai trò
            </label>
            <select
              id="user-role-filter"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as UserRole | '')}
              className="h-11 rounded-lg border border-border-hairline bg-surface px-space-md text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring lg:w-[190px]"
            >
              <option value="">Tất cả vai trò</option>
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
            <label htmlFor="user-facility-filter" className="sr-only">
              Cơ sở
            </label>
            <select
              id="user-facility-filter"
              value={facilityFilter}
              onChange={(event) =>
                setFacilityFilter(event.target.value ? Number(event.target.value) : '')
              }
              className="h-11 rounded-lg border border-border-hairline bg-surface px-space-md text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring lg:w-[200px]"
            >
              <option value="">Tất cả cơ sở</option>
              {facilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name}
                </option>
              ))}
            </select>
            <label htmlFor="user-status-filter" className="sr-only">
              Trạng thái
            </label>
            <select
              id="user-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as UserStatus | '')}
              className="h-11 rounded-lg border border-border-hairline bg-surface px-space-md text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring lg:w-[170px]"
            >
              <option value="">Mọi trạng thái</option>
              <option value="ACTIVE">{USER_STATUS_LABELS.ACTIVE}</option>
              <option value="DISABLED">{USER_STATUS_LABELS.DISABLED}</option>
            </select>
            <Button onClick={() => setFormUser('create')} className="shrink-0">
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                person_add
              </span>
              Tạo tài khoản
            </Button>
          </div>

          <div className="mt-space-lg bg-surface rounded-xl border border-border-hairline overflow-hidden">
            {error ? (
              <div className="p-space-xl text-center">
                <p role="alert" className="text-body-default text-danger">
                  {error}
                </p>
                <Button variant="outline" className="mt-space-md" onClick={() => void reload()}>
                  Thử lại
                </Button>
              </div>
            ) : loading ? (
              <div className="p-space-lg space-y-3" role="status">
                <span className="sr-only">Đang tải danh sách tài khoản…</span>
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-12 rounded-lg bg-surface-muted animate-pulse" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <EmptyState icon="person_search" title="Không có tài khoản khớp bộ lọc." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-ui-table">
                  <thead>
                    <tr className="bg-surface-muted text-left text-text-muted">
                      <th scope="col" className="px-space-lg py-space-md font-semibold">ID</th>
                      <th scope="col" className="px-space-lg py-space-md font-semibold">Họ và tên</th>
                      <th scope="col" className="px-space-lg py-space-md font-semibold">Email</th>
                      <th scope="col" className="px-space-lg py-space-md font-semibold">Vai trò</th>
                      <th scope="col" className="px-space-lg py-space-md font-semibold">Cơ sở phân công</th>
                      <th scope="col" className="px-space-lg py-space-md font-semibold">Trạng thái</th>
                      <th scope="col" className="px-space-lg py-space-md font-semibold">Ngày tạo</th>
                      <th scope="col" className="px-space-lg py-space-md font-semibold text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const toggleGuard = canToggleUserStatus(sessionUser.id, user, users)
                      return (
                        <tr key={user.id} className="border-b border-border-subtle last:border-b-0">
                          <td className="px-space-lg py-space-md font-medium text-text-main">#{user.id}</td>
                          <td className="px-space-lg py-space-md">{user.fullName}</td>
                          <td className="px-space-lg py-space-md">{user.email}</td>
                          <td className="px-space-lg py-space-md">{ROLE_LABELS[user.role]}</td>
                          <td className="px-space-lg py-space-md">{facilityName(user.facilityId)}</td>
                          <td className="px-space-lg py-space-md">
                            <span className="inline-flex items-center gap-1.5 text-label-help text-text-main">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  user.status === 'ACTIVE' ? 'bg-success' : 'bg-danger'
                                }`}
                                aria-hidden="true"
                              />
                              {USER_STATUS_LABELS[user.status]}
                            </span>
                          </td>
                          <td className="px-space-lg py-space-md">{formatDateTime(user.createdAt)}</td>
                          <td className="px-space-lg py-space-md text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setActionError(null)
                                setFormUser(user)
                              }}
                              className="text-label-help font-medium text-primary hover:underline mr-3"
                            >
                              Sửa
                            </button>
                            {user.status === 'ACTIVE' ? (
                              <button
                                type="button"
                                disabled={!toggleGuard.allowed}
                                title={toggleGuard.reason}
                                onClick={() => {
                                  setActionError(null)
                                  setToggleTarget(user)
                                }}
                                className="text-label-help font-medium text-danger hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:no-underline"
                              >
                                Vô hiệu hóa
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setActionError(null)
                                  setToggleTarget(user)
                                }}
                                className="text-label-help font-medium text-success hover:underline"
                              >
                                Khôi phục
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'logs' && (
        <>
          <div className="mt-space-lg flex flex-col lg:flex-row lg:items-center gap-space-md">
            <div className="relative flex-1 min-w-[220px]">
              <label htmlFor="log-search" className="sr-only">
                Tìm nhật ký
              </label>
              <span
                className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-text-muted"
                aria-hidden="true"
              >
                search
              </span>
              <input
                id="log-search"
                type="search"
                value={logSearch}
                onChange={(event) => setLogSearch(event.target.value)}
                placeholder="Tìm theo người thực hiện, hành vi, chi tiết…"
                className="w-full h-11 rounded-lg border border-border-hairline bg-surface pl-10 pr-space-md text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring"
              />
            </div>
            <label htmlFor="log-action-filter" className="sr-only">
              Loại hành vi
            </label>
            <select
              id="log-action-filter"
              value={logAction}
              onChange={(event) => setLogAction(event.target.value)}
              className="h-11 rounded-lg border border-border-hairline bg-surface px-space-md text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring lg:w-[240px]"
            >
              <option value="">Tất cả hành vi</option>
              {ACTION_OPTIONS.map((action) => (
                <option key={action} value={action}>
                  {ACTION_LABELS[action]}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-space-lg bg-surface rounded-xl border border-border-hairline overflow-hidden">
            {logsError ? (
              <div className="p-space-xl text-center">
                <p role="alert" className="text-body-default text-danger">
                  {logsError}
                </p>
                <Button variant="outline" className="mt-space-md" onClick={() => void reloadLogs()}>
                  Thử lại
                </Button>
              </div>
            ) : logsLoading ? (
              <div className="p-space-lg space-y-3" role="status">
                <span className="sr-only">Đang tải nhật ký…</span>
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-12 rounded-lg bg-surface-muted animate-pulse" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <EmptyState icon="history" title="Không có bản ghi phù hợp." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-ui-table">
                  <thead>
                    <tr className="bg-surface-muted text-left text-text-muted">
                      <th scope="col" className="px-space-lg py-space-md font-semibold">Thời gian</th>
                      <th scope="col" className="px-space-lg py-space-md font-semibold">Người thực hiện</th>
                      <th scope="col" className="px-space-lg py-space-md font-semibold">Hành vi</th>
                      <th scope="col" className="px-space-lg py-space-md font-semibold">Đối tượng</th>
                      <th scope="col" className="px-space-lg py-space-md font-semibold">Chi tiết</th>
                      <th scope="col" className="px-space-lg py-space-md font-semibold">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-border-subtle last:border-b-0">
                        <td className="px-space-lg py-space-md whitespace-nowrap">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="px-space-lg py-space-md">{log.actorName}</td>
                        <td className="px-space-lg py-space-md">
                          <span className="block text-text-main">
                            {ACTION_LABELS[log.action] ?? log.action}
                          </span>
                          <span className="block text-badge-caption text-text-muted">{log.action}</span>
                        </td>
                        <td className="px-space-lg py-space-md">
                          {log.entityType ? `${log.entityType}${log.entityId ? ` #${log.entityId}` : ''}` : '—'}
                        </td>
                        <td className="px-space-lg py-space-md max-w-[320px]">{log.detail}</td>
                        <td className="px-space-lg py-space-md font-mono text-badge-caption">
                          {log.ipAddress}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {formUser && (
        <UserFormModal
          user={formUser === 'create' ? undefined : formUser}
          facilities={facilities}
          actorName={sessionUser.fullName}
          onClose={() => setFormUser(null)}
          onSaved={async (message) => {
            setFormUser(null)
            setNotice(message)
            await reload()
            await reloadLogs()
          }}
        />
      )}

      {toggleTarget && (
        <Modal
          title={toggleTarget.status === 'ACTIVE' ? 'Vô hiệu hóa tài khoản' : 'Khôi phục tài khoản'}
          onClose={() => setToggleTarget(null)}
        >
          <p className="text-body-default text-text-main">
            {toggleTarget.status === 'ACTIVE'
              ? `Tài khoản ${toggleTarget.email} sẽ không thể đăng nhập. Dữ liệu lịch sử vẫn được giữ nguyên.`
              : `Tài khoản ${toggleTarget.email} sẽ có thể đăng nhập trở lại.`}
          </p>
          {actionError && (
            <p role="alert" className="mt-space-md text-label-help text-danger">
              {actionError}
            </p>
          )}
          <div className="mt-space-2xl flex justify-end gap-3">
            <Button variant="outline" onClick={() => setToggleTarget(null)} disabled={busy}>
              Hủy
            </Button>
            <Button
              variant={toggleTarget.status === 'ACTIVE' ? 'danger' : 'primary'}
              disabled={busy}
              onClick={() => void handleToggleStatus()}
            >
              {busy ? 'Đang lưu…' : 'Xác nhận'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

interface UserFormModalProps {
  user?: AdminUser
  facilities: Array<{ id: number; name: string }>
  actorName: string
  onClose: () => void
  onSaved: (message: string) => Promise<void>
}

function UserFormModal({ user, facilities, actorName, onClose, onSaved }: UserFormModalProps) {
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [role, setRole] = useState<UserRole>(user?.role ?? 'FACILITY_STAFF')
  const [facilityId, setFacilityId] = useState<number | null>(user?.facilityId ?? null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const needsFacility = role === 'FACILITY_STAFF' || role === 'FACILITY_MANAGER'

  const handleSubmit = async () => {
    const input: UserInput = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role,
      facilityId: needsFacility ? facilityId ?? (facilities[0]?.id ?? null) : null,
    }
    const validation = validateUserInput(input, [], user?.id ?? null)
    setErrors(validation)
    setSubmitError(null)
    if (Object.keys(validation).length > 0) {
      return
    }
    setSubmitting(true)
    try {
      if (user) {
        await updateUser(user.id, input, actorName)
        await onSaved(`Đã cập nhật tài khoản ${input.email}.`)
      } else {
        const created = await createUser(input, actorName)
        await onSaved(`Đã tạo tài khoản #${created.id} (${created.email}).`)
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Không lưu được tài khoản.')
      setSubmitting(false)
    }
  }

  return (
    <Modal title={user ? `Sửa tài khoản #${user.id}` : 'Tạo tài khoản mới'} onClose={onClose}>
      <div>
        <label htmlFor="admin-fullname" className="text-label-help font-medium text-text-main">
          Họ và tên *
        </label>
        <input
          id="admin-fullname"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          aria-invalid={Boolean(errors.fullName)}
          className={INPUT_CLASS}
        />
        {errors.fullName && <p className="mt-1 text-label-help text-danger">{errors.fullName}</p>}
      </div>

      <div className="mt-space-lg">
        <label htmlFor="admin-email" className="text-label-help font-medium text-text-main">
          Email *
        </label>
        <input
          id="admin-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(errors.email)}
          className={INPUT_CLASS}
        />
        {errors.email && <p className="mt-1 text-label-help text-danger">{errors.email}</p>}
      </div>

      <div className="mt-space-lg">
        <label htmlFor="admin-phone" className="text-label-help font-medium text-text-main">
          Số điện thoại
        </label>
        <input
          id="admin-phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className={INPUT_CLASS}
        />
      </div>

      <div className="mt-space-lg">
        <label htmlFor="admin-role" className="text-label-help font-medium text-text-main">
          Vai trò chính * (một tài khoản = một vai trò)
        </label>
        <select
          id="admin-role"
          value={role}
          onChange={(event) => {
            const nextRole = event.target.value as UserRole
            setRole(nextRole)
            if (nextRole !== 'FACILITY_STAFF' && nextRole !== 'FACILITY_MANAGER') {
              setFacilityId(null)
            }
          }}
          className={INPUT_CLASS}
        >
          {ROLE_OPTIONS.map((roleOption) => (
            <option key={roleOption} value={roleOption}>
              {ROLE_LABELS[roleOption]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-space-lg">
        <label htmlFor="admin-facility" className="text-label-help font-medium text-text-main">
          Cơ sở phân công {needsFacility ? '*' : '(chỉ vai trò cơ sở)'}
        </label>
        <select
          id="admin-facility"
          value={facilityId ?? ''}
          disabled={!needsFacility}
          onChange={(event) => setFacilityId(event.target.value ? Number(event.target.value) : null)}
          className={`${INPUT_CLASS} disabled:opacity-50`}
        >
          {needsFacility ? (
            facilities.map((facility) => (
              <option key={facility.id} value={facility.id}>
                {facility.name}
              </option>
            ))
          ) : (
            <option value="">Không gán cơ sở</option>
          )}
        </select>
        {errors.facilityId && <p className="mt-1 text-label-help text-danger">{errors.facilityId}</p>}
      </div>

      {submitError && (
        <p role="alert" className="mt-space-md text-label-help text-danger">
          {submitError}
        </p>
      )}

      <div className="mt-space-2xl flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Hủy
        </Button>
        <Button disabled={submitting} onClick={() => void handleSubmit()}>
          {submitting ? 'Đang lưu…' : user ? 'Lưu thay đổi' : 'Tạo tài khoản'}
        </Button>
      </div>
    </Modal>
  )
}
