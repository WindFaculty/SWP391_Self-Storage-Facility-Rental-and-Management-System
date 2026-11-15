import { useMemo, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'
import { formatCurrency, formatDateTime } from '../../../lib/format'
import { validatePolicy, type PolicyInput } from '../managementRules'
import type { BusinessPolicy } from '../types'

const INPUT_CLASS =
  'mt-space-xs w-full h-11 rounded-lg border border-border-hairline bg-surface px-space-md text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring'

const POLICY_FIELDS: Array<{ key: keyof PolicyInput; label: string; suffix: string }> = [
  { key: 'depositPercent', label: 'Tiền cọc', suffix: '% giá thuê tháng' },
  { key: 'maxDiscountPercent', label: 'Giảm giá tối đa', suffix: '%' },
  { key: 'renewalNoticeDays', label: 'Báo gia hạn trước', suffix: 'ngày' },
  { key: 'returnNoticeDays', label: 'Báo trả kho trước', suffix: 'ngày' },
  { key: 'overdueGraceDays', label: 'Ân hạn quá hạn', suffix: 'ngày' },
  { key: 'overdueFeePerDay', label: 'Phạt trả chậm', suffix: '₫/ngày' },
  { key: 'cancellationFee', label: 'Phí hủy hợp đồng', suffix: '₫' },
]

type PolicyFormValues = Record<keyof PolicyInput, string>

function toFormValues(policy: PolicyInput): PolicyFormValues {
  return {
    depositPercent: String(policy.depositPercent),
    maxDiscountPercent: String(policy.maxDiscountPercent),
    renewalNoticeDays: String(policy.renewalNoticeDays),
    returnNoticeDays: String(policy.returnNoticeDays),
    overdueGraceDays: String(policy.overdueGraceDays),
    overdueFeePerDay: String(policy.overdueFeePerDay),
    cancellationFee: String(policy.cancellationFee),
  }
}

function toPolicyInput(values: PolicyFormValues): PolicyInput {
  return {
    depositPercent: Number(values.depositPercent),
    maxDiscountPercent: Number(values.maxDiscountPercent),
    renewalNoticeDays: Number(values.renewalNoticeDays),
    returnNoticeDays: Number(values.returnNoticeDays),
    overdueGraceDays: Number(values.overdueGraceDays),
    overdueFeePerDay: Number(values.overdueFeePerDay),
    cancellationFee: Number(values.cancellationFee),
  }
}

function formatPolicyValue(key: keyof PolicyInput, value: number): string {
  if (key === 'depositPercent' || key === 'maxDiscountPercent') {
    return `${value}%`
  }
  if (key === 'overdueFeePerDay' || key === 'cancellationFee') {
    return formatCurrency(value)
  }
  return `${value} ngày`
}

interface PolicyFormSectionProps {
  policy: BusinessPolicy
  onSave: (input: PolicyInput) => Promise<void>
}

export function PolicyFormSection({ policy, onSave }: PolicyFormSectionProps) {
  const [draft, setDraft] = useState<PolicyFormValues | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [showPreview, setShowPreview] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const values = useMemo(() => draft ?? toFormValues(policy), [draft, policy])

  const changes = useMemo(() => {
    const input = toPolicyInput(values)
    return POLICY_FIELDS.filter((field) => input[field.key] !== policy[field.key]).map((field) => ({
      key: field.key,
      label: field.label,
      from: formatPolicyValue(field.key, policy[field.key]),
      to: formatPolicyValue(field.key, input[field.key]),
    }))
  }, [policy, values])

  const handleConfirmSave = async () => {
    const input = toPolicyInput(values)
    const validation = validatePolicy(input)
    setFieldErrors(validation)
    if (Object.keys(validation).length > 0) {
      return
    }
    setBusy(true)
    setSaveError(null)
    try {
      await onSave(input)
      setDraft(null)
      setShowPreview(false)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Không lưu được chính sách.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <section className="mt-space-lg bg-surface rounded-xl border border-border-hairline p-space-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <h2 className="text-subsection text-text-main">Chính sách thuê & hợp đồng</h2>
          <p className="text-label-help text-text-muted">
            Cập nhật gần nhất:{' '}
            {policy.updatedAt ? formatDateTime(policy.updatedAt) : 'chưa cập nhật'}
            {policy.updatedBy ? ` bởi ${policy.updatedBy}` : ''}
          </p>
        </div>

        <div className="mt-space-lg grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-lg">
          {POLICY_FIELDS.map((field) => (
            <div key={field.key}>
              <label htmlFor={`policy-${field.key}`} className="text-label-help font-medium text-text-main">
                {field.label} <span className="text-text-muted">({field.suffix})</span>
              </label>
              <input
                id={`policy-${field.key}`}
                type="number"
                min={0}
                step={field.key === 'overdueFeePerDay' || field.key === 'cancellationFee' ? 10_000 : 1}
                value={values[field.key]}
                onChange={(event) => {
                  const nextValue = event.target.value
                  setDraft((current) => ({
                    ...(current ?? toFormValues(policy)),
                    [field.key]: nextValue,
                  }))
                }}
                aria-invalid={Boolean(fieldErrors[field.key])}
                className={INPUT_CLASS}
              />
              {fieldErrors[field.key] && (
                <p className="mt-1 text-label-help text-danger">{fieldErrors[field.key]}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-space-xl flex items-center justify-end gap-3">
          <Button
            variant="outline"
            disabled={changes.length === 0 || busy}
            onClick={() => {
              setDraft(null)
              setFieldErrors({})
            }}
          >
            Hoàn tác
          </Button>
          <Button
            disabled={changes.length === 0 || busy}
            onClick={() => {
              const validation = validatePolicy(toPolicyInput(values))
              setFieldErrors(validation)
              if (Object.keys(validation).length === 0) {
                setSaveError(null)
                setShowPreview(true)
              }
            }}
          >
            Lưu thay đổi chính sách ({changes.length})
          </Button>
        </div>
      </section>

      {showPreview && (
        <Modal title="Xem trước thay đổi chính sách" onClose={() => setShowPreview(false)}>
          <p className="text-body-default text-text-muted">
            Các giá trị sau sẽ được áp dụng toàn hệ thống ngay sau khi xác nhận:
          </p>
          <table className="mt-space-md w-full border-collapse text-ui-table">
            <thead>
              <tr className="text-left text-text-muted">
                <th scope="col" className="py-space-sm font-semibold">Trường</th>
                <th scope="col" className="py-space-sm font-semibold">Hiện tại</th>
                <th scope="col" className="py-space-sm font-semibold">Sau khi lưu</th>
              </tr>
            </thead>
            <tbody>
              {changes.map((change) => (
                <tr key={change.key} className="border-t border-border-subtle">
                  <td className="py-space-sm text-text-main">{change.label}</td>
                  <td className="py-space-sm text-text-muted">{change.from}</td>
                  <td className="py-space-sm font-medium text-primary">{change.to}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {saveError && (
            <p role="alert" className="mt-space-md text-label-help text-danger">
              {saveError}
            </p>
          )}
          <div className="mt-space-2xl flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowPreview(false)} disabled={busy}>
              Hủy
            </Button>
            <Button disabled={busy} onClick={() => void handleConfirmSave()}>
              {busy ? 'Đang lưu…' : 'Xác nhận áp dụng'}
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}
