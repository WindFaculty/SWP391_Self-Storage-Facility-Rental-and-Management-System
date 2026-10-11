import { useState } from 'react'
import { ROLE_LABELS } from '../../../app/providers/SessionProvider'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'
import type { UserRole } from '../../facility/types'
import { createUser, updateUser } from '../api/adminApi'
import { validateUserInput, type UserInput } from '../adminRules'
import type { AdminUser } from '../types'

const ROLE_OPTIONS: UserRole[] = [
  'CUSTOMER',
  'FACILITY_STAFF',
  'FACILITY_MANAGER',
  'BUSINESS_MANAGER',
  'ADMIN',
]

const INPUT_CLASS =
  'mt-space-xs w-full h-11 rounded-lg border border-border-hairline bg-surface px-space-md text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring'

export interface UserFormModalProps {
  user?: AdminUser
  facilities: Array<{ id: number; name: string }>
  onClose: () => void
  onSaved: (message: string) => Promise<void>
}

export function UserFormModal({ user, facilities, onClose, onSaved }: UserFormModalProps) {
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
        await updateUser(user.id, input)
        await onSaved(`Đã cập nhật tài khoản ${input.email}.`)
      } else {
        const created = await createUser(input)
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
