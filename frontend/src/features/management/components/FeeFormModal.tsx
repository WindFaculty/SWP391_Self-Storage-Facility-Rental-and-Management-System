import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'
import { validateFeeTypeCreateInput, validateFeeTypeInput } from '../managementRules'
import type { FeeType } from '../types'

const INPUT_CLASS =
  'mt-space-xs w-full h-11 rounded-lg border border-border-hairline bg-surface px-space-md text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring'

interface FeeFormModalProps {
  fee: FeeType | null
  existingCodes: string[]
  onClose: () => void
  onSubmit: (input: { code: string; name: string; defaultAmount: number; active: boolean }) => Promise<void>
}

export function FeeFormModal({ fee, existingCodes, onClose, onSubmit }: FeeFormModalProps) {
  const isEditing = fee !== null
  const [code, setCode] = useState(fee?.code ?? '')
  const [name, setName] = useState(fee?.name ?? '')
  const [amount, setAmount] = useState(String(fee?.defaultAmount ?? 0))
  const [active, setActive] = useState(fee?.active ?? true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    const parsedAmount = Number(amount)
    const normalizedCode = code.trim().toUpperCase()
    const validationErrors = isEditing
      ? validateFeeTypeInput({ name, defaultAmount: parsedAmount })
      : validateFeeTypeCreateInput({ code: normalizedCode, name, defaultAmount: parsedAmount }, existingCodes)
    const firstError = validationErrors.code ?? validationErrors.name ?? validationErrors.defaultAmount
    if (firstError) {
      setError(firstError)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        code: isEditing ? fee.code : normalizedCode,
        name: name.trim(),
        defaultAmount: parsedAmount,
        active,
      })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không lưu được phụ phí.')
      setSubmitting(false)
    }
  }

  return (
    <Modal title={isEditing ? `Sửa phụ phí ${fee.code}` : 'Thêm phụ phí mới'} onClose={onClose}>
      {!isEditing && (
        <div className="mb-space-lg">
          <label htmlFor="fee-code" className="text-label-help font-medium text-text-main">
            Mã phụ phí *
          </label>
          <input
            id="fee-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="VD: CLEANING"
            className={INPUT_CLASS}
          />
          <p className="mt-1 text-label-help text-text-muted">Chữ in hoa, số, _ hoặc - (2–40 ký tự).</p>
        </div>
      )}
      <div>
        <label htmlFor="fee-name" className="text-label-help font-medium text-text-main">
          Tên phụ phí *
        </label>
        <input
          id="fee-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={INPUT_CLASS}
        />
      </div>
      <div className="mt-space-lg">
        <label htmlFor="fee-amount" className="text-label-help font-medium text-text-main">
          Mức phí mặc định (₫) *
        </label>
        <input
          id="fee-amount"
          type="number"
          min={0}
          step={10_000}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className={INPUT_CLASS}
        />
        <p className="mt-1 text-label-help text-text-muted">Nhập 0 nếu miễn phí.</p>
      </div>
      <label className="mt-space-lg flex items-center gap-2 text-body-default text-text-main">
        <input
          type="checkbox"
          checked={active}
          onChange={(event) => setActive(event.target.checked)}
          className="accent-primary"
        />
        Đang áp dụng
      </label>

      {error && (
        <p role="alert" className="mt-space-md text-label-help text-danger">
          {error}
        </p>
      )}

      <div className="mt-space-2xl flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Hủy
        </Button>
        <Button disabled={submitting} onClick={() => void handleSubmit()}>
          {submitting ? 'Đang lưu…' : isEditing ? 'Lưu thay đổi' : 'Tạo phụ phí'}
        </Button>
      </div>
    </Modal>
  )
}
