import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Modal } from '../../../components/ui/Modal'
import { Tabs } from '../../../components/ui/Tabs'
import { formatArea, formatCurrency, formatDateTime } from '../../../lib/format'
import { useUnitTypes } from '../../facility/hooks/useUnitTypes'
import { updateBusinessPolicy, updateFeeType } from '../api/managementApi'
import { usePolicyData } from '../hooks/useManagement'
import { validatePolicy, type PolicyInput } from '../managementRules'
import type { FeeType } from '../types'

type TabId = 'policy' | 'pricing' | 'fees'

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

export function OperationsPoliciesPage() {
  const { policy, fees, loading, error, reload } = usePolicyData()
  const { unitTypes } = useUnitTypes()
  const [tab, setTab] = useState<TabId>('policy')
  const [values, setValues] = useState<PolicyFormValues | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [showPreview, setShowPreview] = useState(false)
  const [editingFee, setEditingFee] = useState<FeeType | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (policy) {
      setValues(toFormValues(policy))
    }
  }, [policy])

  const changes = useMemo(() => {
    if (!policy || !values) {
      return []
    }
    const input = toPolicyInput(values)
    return POLICY_FIELDS.filter(
      (field) => input[field.key] !== policy[field.key],
    ).map((field) => ({
      key: field.key,
      label: field.label,
      from: formatPolicyValue(field.key, policy[field.key]),
      to: formatPolicyValue(field.key, input[field.key]),
    }))
  }, [policy, values])

  const handleSavePolicy = async () => {
    if (!values) {
      return
    }
    const input = toPolicyInput(values)
    const validation = validatePolicy(input)
    setFieldErrors(validation)
    if (Object.keys(validation).length > 0) {
      return
    }
    setBusy(true)
    setActionError(null)
    try {
      await updateBusinessPolicy(input)
      setShowPreview(false)
      setNotice('Đã lưu chính sách kinh doanh và ghi nhật ký hoạt động.')
      await reload()
    } catch (saveError) {
      setActionError(saveError instanceof Error ? saveError.message : 'Không lưu được chính sách.')
    } finally {
      setBusy(false)
    }
  }

  const tabItems = [
    { id: 'policy', label: 'Chính sách thuê' },
    { id: 'pricing', label: 'Bảng giá & loại kho' },
    { id: 'fees', label: 'Phụ phí' },
  ]

  if (error) {
    return (
      <div className="text-center py-space-4xl">
        <p role="alert" className="text-body-default text-danger">
          {error}
        </p>
        <Button variant="outline" className="mt-space-md" onClick={() => void reload()}>
          Thử lại
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div>
        <p className="text-badge-caption uppercase tracking-wider text-text-muted">Trụ sở & Quản trị</p>
        <h1 className="mt-1 text-page-title text-text-main">Chính sách kinh doanh & Biểu phí</h1>
        <p className="mt-space-xs text-body-default text-text-muted">
          Thiết lập chính sách thuê, khung giá và phụ phí áp dụng toàn hệ thống. Thay đổi lớn cần
          xem trước giá trị cũ/mới trước khi áp dụng.
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
        <Tabs items={tabItems} active={tab} onChange={(id) => setTab(id as TabId)} />
      </div>

      {loading || !policy || !values ? (
        <div className="mt-space-lg space-y-3" role="status">
          <span className="sr-only">Đang tải chính sách…</span>
          <div className="h-24 rounded-xl bg-surface-muted animate-pulse" />
          <div className="h-24 rounded-xl bg-surface-muted animate-pulse" />
        </div>
      ) : (
        <>
          {tab === 'policy' && (
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
                      onChange={(event) =>
                        setValues((current) =>
                          current ? { ...current, [field.key]: event.target.value } : current,
                        )
                      }
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
                    setValues(toFormValues(policy))
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
                      setShowPreview(true)
                    }
                  }}
                >
                  Lưu thay đổi chính sách ({changes.length})
                </Button>
              </div>
            </section>
          )}

          {tab === 'pricing' && (
            <section className="mt-space-lg bg-surface rounded-xl border border-border-hairline overflow-hidden">
              <div className="px-space-lg py-space-md border-b border-border-hairline">
                <h2 className="text-subsection text-text-main">Khung giá niêm yết theo loại kho</h2>
                <p className="text-label-help text-text-muted">
                  Giá thuê từng kho phải nằm trong khoảng Min–Max của loại kho. Việc quản lý loại kho
                  và giá cụ thể thuộc module Kho lưu trữ (BE1); màn hình này hiển thị dữ liệu hiện có.
                </p>
              </div>
              {unitTypes.length === 0 ? (
                <EmptyState title="Chưa tải được loại kho." description="Thử tải lại trang." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-ui-table">
                    <thead>
                      <tr className="bg-surface-muted text-left text-text-muted">
                        <th scope="col" className="px-space-lg py-space-md font-semibold">Loại kho</th>
                        <th scope="col" className="px-space-lg py-space-md font-semibold">Diện tích</th>
                        <th scope="col" className="px-space-lg py-space-md font-semibold text-right">Giá sàn</th>
                        <th scope="col" className="px-space-lg py-space-md font-semibold text-right">Giá trần</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unitTypes.map((unitType) => (
                        <tr key={unitType.id} className="border-b border-border-subtle last:border-b-0">
                          <td className="px-space-lg py-space-md font-medium text-text-main">{unitType.name}</td>
                          <td className="px-space-lg py-space-md">{formatArea(unitType.sizeM2)}</td>
                          <td className="px-space-lg py-space-md text-right tabular-nums">
                            {formatCurrency(unitType.minMonthlyPrice)}
                          </td>
                          <td className="px-space-lg py-space-md text-right tabular-nums">
                            {formatCurrency(unitType.maxMonthlyPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {tab === 'fees' && (
            <section className="mt-space-lg bg-surface rounded-xl border border-border-hairline overflow-hidden">
              <div className="px-space-lg py-space-md border-b border-border-hairline">
                <h2 className="text-subsection text-text-main">Biểu phí dịch vụ & phụ phí</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-ui-table">
                  <thead>
                    <tr className="bg-surface-muted text-left text-text-muted">
                      <th scope="col" className="px-space-lg py-space-md font-semibold">Mã</th>
                      <th scope="col" className="px-space-lg py-space-md font-semibold">Tên phụ phí</th>
                      <th scope="col" className="px-space-lg py-space-md font-semibold text-right">Mức phí</th>
                      <th scope="col" className="px-space-lg py-space-md font-semibold">Trạng thái</th>
                      <th scope="col" className="px-space-lg py-space-md font-semibold text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.map((fee) => (
                      <tr key={fee.id} className="border-b border-border-subtle last:border-b-0">
                        <td className="px-space-lg py-space-md font-medium text-text-main">{fee.code}</td>
                        <td className="px-space-lg py-space-md">{fee.name}</td>
                        <td className="px-space-lg py-space-md text-right tabular-nums">
                          {fee.defaultAmount === 0 ? 'Miễn phí' : formatCurrency(fee.defaultAmount)}
                        </td>
                        <td className="px-space-lg py-space-md">
                          {fee.active ? 'Đang áp dụng' : 'Tạm ngừng'}
                        </td>
                        <td className="px-space-lg py-space-md text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setActionError(null)
                              setEditingFee(fee)
                            }}
                            className="text-label-help font-medium text-primary hover:underline"
                          >
                            Sửa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

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
          {actionError && (
            <p role="alert" className="mt-space-md text-label-help text-danger">
              {actionError}
            </p>
          )}
          <div className="mt-space-2xl flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowPreview(false)} disabled={busy}>
              Hủy
            </Button>
            <Button disabled={busy} onClick={() => void handleSavePolicy()}>
              {busy ? 'Đang lưu…' : 'Xác nhận áp dụng'}
            </Button>
          </div>
        </Modal>
      )}

      {editingFee && (
        <FeeEditModal
          fee={editingFee}
          onClose={() => setEditingFee(null)}
          onSubmit={async (input) => {
            await updateFeeType(editingFee.id, input)
            setEditingFee(null)
            setNotice(`Đã cập nhật phụ phí ${editingFee.code}.`)
            await reload()
          }}
        />
      )}
    </div>
  )
}

interface FeeEditModalProps {
  fee: FeeType
  onClose: () => void
  onSubmit: (input: { name: string; defaultAmount: number; active: boolean }) => Promise<void>
}

function FeeEditModal({ fee, onClose, onSubmit }: FeeEditModalProps) {
  const [name, setName] = useState(fee.name)
  const [amount, setAmount] = useState(String(fee.defaultAmount))
  const [active, setActive] = useState(fee.active)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Nhập tên phụ phí.')
      return
    }
    const parsedAmount = Number(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      setError('Mức phí phải là số không âm.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({ name: name.trim(), defaultAmount: parsedAmount, active })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không lưu được phụ phí.')
      setSubmitting(false)
    }
  }

  return (
    <Modal title={`Sửa phụ phí ${fee.code}`} onClose={onClose}>
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
          className="accent-[#24553E]"
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
          {submitting ? 'Đang lưu…' : 'Lưu thay đổi'}
        </Button>
      </div>
    </Modal>
  )
}
