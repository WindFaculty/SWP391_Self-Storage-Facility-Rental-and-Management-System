import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Drawer } from '../../../components/ui/Drawer'
import { formatArea, formatCurrency } from '../../../lib/format'
import { isStatusTransitionAllowed, requiresStatusReason, UNIT_STATUS_LABELS } from '../unitRules'
import type { StorageUnit, UnitStatus, UnitType } from '../types'
import { UnitStatusLabel } from './UnitStatusLabel'

interface UnitDrawerProps {
  unit: StorageUnit
  unitType?: UnitType
  onClose: () => void
  onEdit: () => void
  onStatusChange: (to: UnitStatus, reason?: string) => Promise<void>
}

const TARGET_OPTIONS: UnitStatus[] = ['AVAILABLE', 'INSPECTION', 'MAINTENANCE']

export function UnitDrawer({ unit, unitType, onClose, onEdit, onStatusChange }: UnitDrawerProps) {
  const [pendingTarget, setPendingTarget] = useState<UnitStatus | null>(null)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (target: UnitStatus) => {
    setSubmitting(true)
    setError(null)
    try {
      await onStatusChange(target, reason)
      setPendingTarget(null)
      setReason('')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không cập nhật được trạng thái.')
    } finally {
      setSubmitting(false)
    }
  }

  const requestChange = (target: UnitStatus) => {
    setError(null)
    if (requiresStatusReason(target)) {
      setPendingTarget(target)
      setReason('')
    } else {
      void submit(target)
    }
  }

  return (
    <Drawer
      title={`Chi tiết kho ${unit.unitCode}`}
      onClose={onClose}
      footer={
        <Button variant="outline" onClick={onEdit}>
          Sửa thông tin kho
        </Button>
      }
    >
      <section>
        <h3 className="text-subsection text-text-main">Thông số kho</h3>
        <dl className="mt-space-sm">
          <SpecRow label="Mã kho" value={unit.unitCode} />
          <SpecRow label="Loại kho" value={unitType?.name ?? '—'} />
          <SpecRow label="Diện tích" value={unitType ? formatArea(unitType.sizeM2) : '—'} />
          <SpecRow label="Vị trí / Tầng" value={unit.locationLabel} />
          <SpecRow label="Giá thuê niêm yết" value={formatCurrency(unit.monthlyPrice)} />
          <SpecRow label="Mã hệ thống" value={`#${unit.id}`} />
        </dl>
      </section>

      <section className="mt-space-xl">
        <h3 className="text-subsection text-text-main">Trạng thái vận hành</h3>
        <div className="mt-space-sm">
          <UnitStatusLabel status={unit.status} />
        </div>
        <p className="mt-space-xs text-label-help text-text-muted">
          Kho đang thuê chỉ chuyển sang kiểm tra/bảo trì theo luồng trả kho; không thể chuyển thẳng
          về Sẵn sàng. Kho chỉ chuyển sang Đang thuê qua luồng giao kho.
        </p>

        <div className="mt-space-md flex flex-wrap gap-2">
          {TARGET_OPTIONS.map((target) => {
            const transition = isStatusTransitionAllowed(unit.status, target)
            return (
              <Button
                key={target}
                variant="outline"
                compact
                disabled={!transition.allowed || submitting}
                title={transition.reason}
                onClick={() => requestChange(target)}
              >
                {UNIT_STATUS_LABELS[target]}
              </Button>
            )
          })}
        </div>

        {pendingTarget && (
          <div className="mt-space-md p-space-md rounded-lg bg-surface-muted border border-border-hairline">
            <label htmlFor="status-reason" className="text-label-help font-medium text-text-main">
              Lý do chuyển sang {UNIT_STATUS_LABELS[pendingTarget]}
            </label>
            <textarea
              id="status-reason"
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="mt-space-xs w-full rounded-lg border border-border-hairline bg-surface px-space-md py-space-sm text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring"
            />
            <div className="mt-space-sm flex justify-end gap-3">
              <Button variant="outline" compact disabled={submitting} onClick={() => setPendingTarget(null)}>
                Hủy
              </Button>
              <Button compact disabled={submitting || !reason.trim()} onClick={() => void submit(pendingTarget)}>
                {submitting ? 'Đang lưu…' : 'Xác nhận chuyển'}
              </Button>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-space-sm text-label-help text-danger">
            {error}
          </p>
        )}
      </section>

      <p className="mt-space-xl text-label-help text-text-muted">
        Thông tin khách thuê và hợp đồng sẽ hiển thị khi module thuê được tích hợp API.
      </p>
    </Drawer>
  )
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-space-lg py-space-sm border-b border-border-subtle last:border-b-0">
      <dt className="text-label-help text-text-muted">{label}</dt>
      <dd className="text-body-medium text-text-main text-right">{value}</dd>
    </div>
  )
}
