import { useEffect, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Drawer } from '../../../components/ui/Drawer'
import { formatCurrency, formatDate, formatDateTime } from '../../../lib/format'
import { completeHandover, completeTask, getRental, startTask } from '../../facility/api/rentalOpsApi'
import { PaymentStateLabel, RentalStatusLabel, TaskStatusLabel } from '../../facility/components/StatusLabels'
import { ACCESS_METHOD_LABELS, canHandover, TASK_TYPE_LABELS } from '../../facility/rentalRules'
import type { AccessMethod, Rental, StaffTask } from '../../facility/types'

const CHECKLIST_ITEMS = [
  { key: 'identity' as const, label: 'Đã đối chiếu khách thuê và giấy tờ tùy thân' },
  { key: 'condition' as const, label: 'Kho đúng tình trạng niêm yết, sạch và an toàn' },
  { key: 'access' as const, label: 'Đã bàn giao thiết bị truy cập (khóa/thẻ/mã)' },
]

const ACCESS_METHODS: AccessMethod[] = ['KEY', 'ACCESS_CARD', 'ACCESS_CODE']

interface TaskDrawerProps {
  task: StaffTask
  onClose: () => void
  onMutated: () => void
  onCompleted: (message: string) => void
}

export function TaskDrawer({ task: initialTask, onClose, onMutated, onCompleted }: TaskDrawerProps) {
  const [task, setTask] = useState(initialTask)
  const [notes, setNotes] = useState(initialTask.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [rental, setRental] = useState<Rental | null>(null)
  const [rentalLoading, setRentalLoading] = useState(false)

  const [checklist, setChecklist] = useState({ identity: false, condition: false, access: false })
  const [accessMethod, setAccessMethod] = useState<AccessMethod>('ACCESS_CARD')
  const [handoverCondition, setHandoverCondition] = useState('')

  useEffect(() => {
    if (task.taskType !== 'HANDOVER' || !task.rentalId) {
      return
    }
    let cancelled = false
    setRentalLoading(true)
    void getRental(task.rentalId)
      .then((item) => {
        if (!cancelled) {
          setRental(item)
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Không tải được hợp đồng.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setRentalLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [task.taskType, task.rentalId])

  const handleStart = async () => {
    setBusy(true)
    setError(null)
    try {
      const updated = await startTask(task.id)
      setTask(updated)
      onMutated()
      setBusy(false)
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'Không nhận được công việc.')
      setBusy(false)
    }
  }

  const handleComplete = async () => {
    setBusy(true)
    setError(null)
    try {
      await completeTask(task.id, notes)
      onCompleted(`Đã hoàn thành công việc #${task.id}.`)
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : 'Không ghi nhận được kết quả.')
      setBusy(false)
    }
  }

  const eligibility = rental ? canHandover(rental) : null
  const checklistDone = checklist.identity && checklist.condition && checklist.access
  const canCompleteHandover =
    Boolean(eligibility?.allowed) &&
    task.status === 'IN_PROGRESS' &&
    checklistDone &&
    handoverCondition.trim().length > 0

  const handleHandover = async () => {
    if (!rental) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      await completeHandover(task.id, { accessMethod, handoverCondition })
      onCompleted(`Đã bàn giao kho ${rental.unitCode} và kích hoạt hợp đồng #${rental.id}.`)
    } catch (handoverError) {
      setError(handoverError instanceof Error ? handoverError.message : 'Không hoàn tất được bàn giao.')
      setBusy(false)
    }
  }

  return (
    <Drawer title={`Công việc #${task.id}`} onClose={onClose}>
      <section>
        <h3 className="text-subsection text-text-main">Thông tin công việc</h3>
        <dl className="mt-space-sm">
          <SpecRow label="Loại công việc" value={TASK_TYPE_LABELS[task.taskType]} />
          <div className="flex items-baseline justify-between gap-space-lg py-space-sm border-b border-border-subtle">
            <dt className="text-label-help text-text-muted">Trạng thái</dt>
            <dd>
              <TaskStatusLabel status={task.status} />
            </dd>
          </div>
          <SpecRow label="Phụ trách" value={task.assignedStaffName} />
          <SpecRow label="Khung giờ" value={formatDateTime(task.scheduledAt)} />
          {task.customerName && <SpecRow label="Khách hàng" value={task.customerName} />}
          {task.unitCode && <SpecRow label="Kho" value={task.unitCode} />}
          {task.ticketId && <SpecRow label="Ticket" value={`#${task.ticketId}`} />}
          {task.paymentState && (
            <div className="flex items-baseline justify-between gap-space-lg py-space-sm border-b border-border-subtle">
              <dt className="text-label-help text-text-muted">Thanh toán</dt>
              <dd>
                <PaymentStateLabel state={task.paymentState} />
              </dd>
            </div>
          )}
          {task.completedAt && <SpecRow label="Hoàn thành lúc" value={formatDateTime(task.completedAt)} />}
          {task.notes && <SpecRow label="Ghi chú" value={task.notes} />}
        </dl>
      </section>

      {task.taskType === 'HANDOVER' && (
        <section className="mt-space-xl">
          <h3 className="text-subsection text-text-main">Bàn giao kho & Check-in</h3>

          {rentalLoading ? (
            <div className="mt-space-sm space-y-2" role="status">
              <span className="sr-only">Đang tải hợp đồng…</span>
              <div className="h-12 rounded-lg bg-surface-muted animate-pulse" />
              <div className="h-12 rounded-lg bg-surface-muted animate-pulse" />
            </div>
          ) : rental ? (
            <>
              <dl className="mt-space-sm">
                <SpecRow label="Khách thuê" value={`${rental.customerName} • ${rental.customerPhone}`} />
                <SpecRow label="Kho" value={`${rental.unitCode} (${rental.unitTypeName})`} />
                <SpecRow
                  label="Thời hạn thuê"
                  value={`${formatDate(rental.startDate)} – ${formatDate(rental.endDate)}`}
                />
                <SpecRow label="Giá thuê/tháng" value={formatCurrency(rental.pricePerMonth)} />
                <SpecRow
                  label="Lịch hẹn"
                  value={rental.appointmentAt ? formatDateTime(rental.appointmentAt) : '—'}
                />
              </dl>

              <div className="mt-space-sm flex flex-wrap items-center gap-space-lg">
                <RentalStatusLabel status={rental.status} />
                <PaymentStateLabel state={rental.paymentState} />
              </div>

              {eligibility && (
                <p
                  role="status"
                  className={`mt-space-md rounded-lg px-space-lg py-space-md text-label-help ${
                    eligibility.allowed
                      ? 'bg-success-bg text-success'
                      : 'bg-danger-bg text-danger'
                  }`}
                >
                  {eligibility.allowed
                    ? 'Đủ điều kiện bàn giao: hợp đồng chờ nhận kho và đã thanh toán đầy đủ.'
                    : eligibility.reason}
                </p>
              )}

              {task.status === 'ASSIGNED' && (
                <Button className="mt-space-md" disabled={busy} onClick={() => void handleStart()}>
                  {busy ? 'Đang xử lý…' : 'Nhận việc'}
                </Button>
              )}

              {task.status === 'IN_PROGRESS' && (
                <div className="mt-space-md">
                  <fieldset className="space-y-2">
                    <legend className="text-label-help font-medium text-text-main">
                      Kiểm tra bàn giao
                    </legend>
                    {CHECKLIST_ITEMS.map((item) => (
                      <label key={item.key} className="flex items-start gap-2 text-body-default text-text-main">
                        <input
                          type="checkbox"
                          checked={checklist[item.key]}
                          onChange={(event) =>
                            setChecklist((current) => ({ ...current, [item.key]: event.target.checked }))
                          }
                          className="mt-1 accent-[#24553E]"
                        />
                        {item.label}
                      </label>
                    ))}
                  </fieldset>

                  <div className="mt-space-md">
                    <label htmlFor="access-method" className="text-label-help font-medium text-text-main">
                      Phương thức truy cập bàn giao *
                    </label>
                    <select
                      id="access-method"
                      value={accessMethod}
                      onChange={(event) => setAccessMethod(event.target.value as AccessMethod)}
                      className="mt-space-xs w-full h-11 rounded-lg border border-border-hairline bg-surface px-space-md text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring"
                    >
                      {ACCESS_METHODS.map((method) => (
                        <option key={method} value={method}>
                          {ACCESS_METHOD_LABELS[method]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-space-md">
                    <label htmlFor="handover-condition" className="text-label-help font-medium text-text-main">
                      Tình trạng bàn giao kho *
                    </label>
                    <textarea
                      id="handover-condition"
                      rows={3}
                      value={handoverCondition}
                      onChange={(event) => setHandoverCondition(event.target.value)}
                      placeholder="Ví dụ: Kho sạch, khóa điện tử hoạt động tốt, đã hướng dẫn quy định ra vào."
                      className="mt-space-xs w-full rounded-lg border border-border-hairline bg-surface px-space-md py-space-sm text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring"
                    />
                  </div>

                  <Button
                    className="mt-space-md"
                    disabled={!canCompleteHandover || busy}
                    onClick={() => void handleHandover()}
                  >
                    {busy ? 'Đang lưu…' : 'Xác nhận hoàn tất & Kích hoạt kho'}
                  </Button>
                </div>
              )}

              {task.status === 'DONE' && rental.checkedInAt && (
                <dl className="mt-space-md">
                  <SpecRow label="Nhận kho lúc" value={formatDateTime(rental.checkedInAt)} />
                  <SpecRow
                    label="Phương thức truy cập"
                    value={rental.accessMethod ? ACCESS_METHOD_LABELS[rental.accessMethod] : '—'}
                  />
                  <SpecRow label="Tình trạng" value={rental.handoverCondition ?? '—'} />
                </dl>
              )}
            </>
          ) : (
            <p className="mt-space-sm text-label-help text-text-muted">Không có hợp đồng gắn với công việc.</p>
          )}
        </section>
      )}

      {task.taskType !== 'HANDOVER' && (
        <section className="mt-space-xl">
          {task.status === 'ASSIGNED' && (
            <Button disabled={busy} onClick={() => void handleStart()}>
              {busy ? 'Đang xử lý…' : 'Nhận việc'}
            </Button>
          )}

          {task.status === 'IN_PROGRESS' && (
            <div>
              <label htmlFor="task-result" className="text-label-help font-medium text-text-main">
                Ghi nhận kết quả *
              </label>
              <textarea
                id="task-result"
                rows={4}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Mô tả tình trạng thực tế và kết quả thực hiện…"
                className="mt-space-xs w-full rounded-lg border border-border-hairline bg-surface px-space-md py-space-sm text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring"
              />
              <Button
                className="mt-space-md"
                disabled={!notes.trim() || busy}
                onClick={() => void handleComplete()}
              >
                {busy ? 'Đang lưu…' : 'Ghi nhận hoàn tất'}
              </Button>
            </div>
          )}

          {task.status === 'DONE' && (
            <p className="text-label-help text-text-muted">
              Công việc đã hoàn thành. Chi tiết kiểm tra trả kho/bảo trì sẽ bổ sung ở giai đoạn FE2-04.
            </p>
          )}
        </section>
      )}

      {error && (
        <p role="alert" className="mt-space-md text-label-help text-danger">
          {error}
        </p>
      )}
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
