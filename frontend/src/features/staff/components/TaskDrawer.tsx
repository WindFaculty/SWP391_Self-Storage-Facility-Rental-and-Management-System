import { useEffect, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Drawer } from '../../../components/ui/Drawer'
import { formatCurrency, formatDate, formatDateTime } from '../../../lib/format'
import {
  completeHandover,
  completeReturn,
  completeTask,
  completeUnitInspection,
  getRental,
  startTask,
} from '../../facility/api/rentalOpsApi'
import { getTicket } from '../../facility/api/supportTicketsApi'
import {
  PaymentStateLabel,
  RentalStatusLabel,
  TaskStatusLabel,
  TicketStatusLabel,
} from '../../facility/components/StatusLabels'
import {
  ACCESS_METHOD_LABELS,
  canHandover,
  canReturn,
  TASK_TYPE_LABELS,
} from '../../facility/rentalRules'
import { TICKET_CATEGORY_LABELS } from '../../facility/supportRules'
import type {
  AccessMethod,
  Rental,
  StaffTask,
  SupportTicket,
  UnitInspectionResult,
} from '../../facility/types'

const HANDOVER_CHECKLIST = [
  { key: 'identity' as const, label: 'Đã đối chiếu khách thuê và giấy tờ tùy thân' },
  { key: 'condition' as const, label: 'Kho đúng tình trạng niêm yết, sạch và an toàn' },
  { key: 'access' as const, label: 'Đã bàn giao thiết bị truy cập (khóa/thẻ/mã)' },
]

const RETURN_CHECKLIST = [
  { key: 'emptied' as const, label: 'Khách đã dọn hết đồ đạc khỏi kho' },
  { key: 'device' as const, label: 'Đã thu hồi thiết bị truy cập (khóa/thẻ/mã)' },
  { key: 'recorded' as const, label: 'Đã ghi nhận tình trạng và hư hỏng (nếu có)' },
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

  const [ticket, setTicket] = useState<SupportTicket | null>(null)
  const [ticketLoading, setTicketLoading] = useState(false)

  const [handoverChecklist, setHandoverChecklist] = useState({
    identity: false,
    condition: false,
    access: false,
  })
  const [accessMethod, setAccessMethod] = useState<AccessMethod>('ACCESS_CARD')
  const [handoverCondition, setHandoverCondition] = useState('')

  const [returnChecklist, setReturnChecklist] = useState({
    emptied: false,
    device: false,
    recorded: false,
  })
  const [returnCondition, setReturnCondition] = useState('')

  const [inspectionResult, setInspectionResult] = useState<UnitInspectionResult>('PASS')
  const [inspectionNotes, setInspectionNotes] = useState('')

  useEffect(() => {
    if (!task.rentalId) {
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
  }, [task.rentalId])

  useEffect(() => {
    if (task.taskType !== 'SUPPORT' || !task.ticketId) {
      return
    }
    let cancelled = false
    setTicketLoading(true)
    void getTicket(task.ticketId)
      .then((item) => {
        if (!cancelled) {
          setTicket(item)
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Không tải được ticket.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setTicketLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [task.taskType, task.ticketId])

  const handleStart = async () => {
    setBusy(true)
    setError(null)
    try {
      const updated = await startTask(task.id)
      setTask(updated)
      onMutated()
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'Không nhận được công việc.')
    } finally {
      setBusy(false)
    }
  }

  const handleCompleteSupport = async () => {
    setBusy(true)
    setError(null)
    try {
      await completeTask(task.id, notes)
      const ticketMessage = ticket ? `; ticket #${ticket.id} chuyển sang Đã giải quyết` : ''
      onCompleted(`Đã hoàn thành công việc #${task.id}${ticketMessage}.`)
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : 'Không ghi nhận được kết quả.')
      setBusy(false)
    }
  }

  const handoverEligibility = rental ? canHandover(rental) : null
  const handoverChecklistDone =
    handoverChecklist.identity && handoverChecklist.condition && handoverChecklist.access
  const canCompleteHandover =
    Boolean(handoverEligibility?.allowed) &&
    task.status === 'IN_PROGRESS' &&
    handoverChecklistDone &&
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

  const returnEligibility = rental ? canReturn(rental) : null
  const returnChecklistDone =
    returnChecklist.emptied && returnChecklist.device && returnChecklist.recorded
  const canCompleteReturn =
    Boolean(returnEligibility?.allowed) &&
    task.status === 'IN_PROGRESS' &&
    returnChecklistDone &&
    returnCondition.trim().length > 0

  const handleReturn = async () => {
    if (!rental) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      await completeReturn(task.id, { condition: returnCondition })
      onCompleted(
        `Đã xác nhận trả kho ${rental.unitCode}; hợp đồng #${rental.id} đã kết thúc và kho chuyển sang kiểm tra.`,
      )
    } catch (returnError) {
      setError(returnError instanceof Error ? returnError.message : 'Không xác nhận được trả kho.')
      setBusy(false)
    }
  }

  const handleInspection = async () => {
    if (!rental) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      await completeUnitInspection(task.id, { result: inspectionResult, notes: inspectionNotes })
      onCompleted(
        inspectionResult === 'PASS'
          ? `Kho ${rental.unitCode} đạt kiểm tra và sẵn sàng cho thuê lại.`
          : `Kho ${rental.unitCode} không đạt kiểm tra và chuyển sang bảo trì.`,
      )
    } catch (inspectionError) {
      setError(inspectionError instanceof Error ? inspectionError.message : 'Không ghi nhận được kết quả.')
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
            <LoadingBlock label="Đang tải hợp đồng…" />
          ) : rental ? (
            <>
              <RentalSummary rental={rental} />

              {handoverEligibility && (
                <EligibilityBanner eligibility={handoverEligibility} allowedText="Đủ điều kiện bàn giao: hợp đồng chờ nhận kho và đã thanh toán đầy đủ." />
              )}

              {task.status === 'ASSIGNED' && (
                <Button className="mt-space-md" disabled={busy} onClick={() => void handleStart()}>
                  {busy ? 'Đang xử lý…' : 'Nhận việc'}
                </Button>
              )}

              {task.status === 'IN_PROGRESS' && (
                <div className="mt-space-md">
                  <Checklist
                    legend="Kiểm tra bàn giao"
                    items={HANDOVER_CHECKLIST}
                    values={handoverChecklist}
                    onToggle={(key, checked) =>
                      setHandoverChecklist((current) => ({ ...current, [key]: checked }))
                    }
                  />

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

                  <TextAreaField
                    id="handover-condition"
                    label="Tình trạng bàn giao kho *"
                    value={handoverCondition}
                    onChange={setHandoverCondition}
                    placeholder="Ví dụ: Kho sạch, khóa điện tử hoạt động tốt, đã hướng dẫn quy định ra vào."
                  />

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

      {task.taskType === 'RETURN_INSPECTION' && (
        <section className="mt-space-xl">
          <h3 className="text-subsection text-text-main">Trả kho & Check-out</h3>

          {rentalLoading ? (
            <LoadingBlock label="Đang tải hợp đồng…" />
          ) : rental ? (
            <>
              <RentalSummary rental={rental} />

              {returnEligibility && (
                <EligibilityBanner
                  eligibility={returnEligibility}
                  allowedText="Đủ điều kiện xác nhận trả kho. Sau khi xác nhận, kho chuyển sang Kiểm tra."
                />
              )}

              {task.status === 'ASSIGNED' && (
                <Button className="mt-space-md" disabled={busy} onClick={() => void handleStart()}>
                  {busy ? 'Đang xử lý…' : 'Nhận việc'}
                </Button>
              )}

              {task.status === 'IN_PROGRESS' && (
                <div className="mt-space-md">
                  <Checklist
                    legend="Checklist trả kho"
                    items={RETURN_CHECKLIST}
                    values={returnChecklist}
                    onToggle={(key, checked) =>
                      setReturnChecklist((current) => ({ ...current, [key]: checked }))
                    }
                  />

                  <TextAreaField
                    id="return-condition"
                    label="Tình trạng kho khi trả & hư hỏng ghi nhận *"
                    value={returnCondition}
                    onChange={setReturnCondition}
                    placeholder="Ví dụ: Kho sạch, gioăng cửa hơi rách; đã thu hồi 1 thẻ truy cập."
                  />

                  <Button
                    className="mt-space-md"
                    disabled={!canCompleteReturn || busy}
                    onClick={() => void handleReturn()}
                  >
                    {busy ? 'Đang lưu…' : 'Xác nhận đã trả kho & Chuyển kiểm tra'}
                  </Button>
                </div>
              )}

              {task.status === 'DONE' && rental.returnedAt && (
                <dl className="mt-space-md">
                  <SpecRow label="Trả kho lúc" value={formatDateTime(rental.returnedAt)} />
                  <SpecRow label="Tình trạng" value={rental.returnCondition ?? '—'} />
                </dl>
              )}
            </>
          ) : (
            <p className="mt-space-sm text-label-help text-text-muted">Không có hợp đồng gắn với công việc.</p>
          )}
        </section>
      )}

      {task.taskType === 'UNIT_INSPECTION' && (
        <section className="mt-space-xl">
          <h3 className="text-subsection text-text-main">Kết quả kiểm tra kho</h3>

          {rentalLoading ? (
            <LoadingBlock label="Đang tải hợp đồng…" />
          ) : rental ? (
            <>
              <RentalSummary rental={rental} />

              {task.status === 'ASSIGNED' && (
                <Button className="mt-space-md" disabled={busy} onClick={() => void handleStart()}>
                  {busy ? 'Đang xử lý…' : 'Nhận việc'}
                </Button>
              )}

              {task.status === 'IN_PROGRESS' && (
                <div className="mt-space-md">
                  <fieldset>
                    <legend className="text-label-help font-medium text-text-main">Kết quả kiểm tra *</legend>
                    <div className="mt-space-xs flex flex-wrap gap-space-lg">
                      <label className="flex items-center gap-2 text-body-default text-text-main">
                        <input
                          type="radio"
                          name="inspection-result"
                          checked={inspectionResult === 'PASS'}
                          onChange={() => setInspectionResult('PASS')}
                          className="accent-[#24553E]"
                        />
                        Đạt — chuyển kho về Sẵn sàng
                      </label>
                      <label className="flex items-center gap-2 text-body-default text-text-main">
                        <input
                          type="radio"
                          name="inspection-result"
                          checked={inspectionResult === 'FAIL'}
                          onChange={() => setInspectionResult('FAIL')}
                          className="accent-[#24553E]"
                        />
                        Không đạt — chuyển Bảo trì
                      </label>
                    </div>
                  </fieldset>

                  <TextAreaField
                    id="inspection-notes"
                    label="Ghi nhận kết quả kiểm tra *"
                    value={inspectionNotes}
                    onChange={setInspectionNotes}
                    placeholder="Ví dụ: Gioăng cửa cần thay; khóa điện tử và cảm biến hoạt động tốt."
                  />

                  <Button
                    className="mt-space-md"
                    disabled={!inspectionNotes.trim() || busy}
                    onClick={() => void handleInspection()}
                  >
                    {busy ? 'Đang lưu…' : 'Ghi nhận kết quả kiểm tra'}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="mt-space-sm text-label-help text-text-muted">Không có hợp đồng gắn với công việc.</p>
          )}
        </section>
      )}

      {task.taskType === 'SUPPORT' && (
        <section className="mt-space-xl">
          <h3 className="text-subsection text-text-main">Ticket hỗ trợ</h3>

          {ticketLoading ? (
            <LoadingBlock label="Đang tải ticket…" />
          ) : ticket ? (
            <>
              <dl className="mt-space-sm">
                <SpecRow label="Tiêu đề" value={`#${ticket.id} • ${ticket.title}`} />
                <SpecRow label="Phân loại" value={TICKET_CATEGORY_LABELS[ticket.category]} />
                <SpecRow label="Khách hàng" value={ticket.customerName} />
                <SpecRow label="Kho liên quan" value={ticket.unitCode ?? 'Không gắn kho'} />
                <SpecRow label="Tạo lúc" value={formatDateTime(ticket.createdAt)} />
              </dl>

              <div className="mt-space-sm flex items-center gap-2">
                <span className="text-label-help text-text-muted">Trạng thái ticket:</span>
                <TicketStatusLabel status={ticket.status} />
              </div>

              <p className="mt-space-sm rounded-lg bg-surface-muted border border-border-hairline p-space-md text-body-default text-text-main">
                {ticket.description}
              </p>

              {task.status === 'ASSIGNED' && (
                <Button className="mt-space-md" disabled={busy} onClick={() => void handleStart()}>
                  {busy ? 'Đang xử lý…' : 'Nhận việc'}
                </Button>
              )}

              {task.status === 'IN_PROGRESS' && (
                <div className="mt-space-md">
                  <TextAreaField
                    id="support-result"
                    label="Ghi nhận kết quả xử lý *"
                    value={notes}
                    onChange={setNotes}
                    placeholder="Mô tả nguyên nhân và cách xử lý ticket…"
                  />
                  <Button
                    className="mt-space-md"
                    disabled={!notes.trim() || busy}
                    onClick={() => void handleCompleteSupport()}
                  >
                    {busy ? 'Đang lưu…' : 'Ghi nhận hoàn tất'}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="mt-space-sm text-label-help text-text-muted">Không tìm thấy ticket liên quan.</p>
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

function RentalSummary({ rental }: { rental: Rental }) {
  return (
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
    </>
  )
}

function EligibilityBanner({
  eligibility,
  allowedText,
}: {
  eligibility: { allowed: boolean; reason?: string }
  allowedText: string
}) {
  return (
    <p
      role="status"
      className={`mt-space-md rounded-lg px-space-lg py-space-md text-label-help ${
        eligibility.allowed ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'
      }`}
    >
      {eligibility.allowed ? allowedText : eligibility.reason}
    </p>
  )
}

function Checklist<T extends string>({
  legend,
  items,
  values,
  onToggle,
}: {
  legend: string
  items: Array<{ key: T; label: string }>
  values: Record<T, boolean>
  onToggle: (key: T, checked: boolean) => void
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-label-help font-medium text-text-main">{legend}</legend>
      {items.map((item) => (
        <label key={item.key} className="flex items-start gap-2 text-body-default text-text-main">
          <input
            type="checkbox"
            checked={values[item.key]}
            onChange={(event) => onToggle(item.key, event.target.checked)}
            className="mt-1 accent-[#24553E]"
          />
          {item.label}
        </label>
      ))}
    </fieldset>
  )
}

function TextAreaField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div className="mt-space-md">
      <label htmlFor={id} className="text-label-help font-medium text-text-main">
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-space-xs w-full rounded-lg border border-border-hairline bg-surface px-space-md py-space-sm text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring"
      />
    </div>
  )
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="mt-space-sm space-y-2" role="status">
      <span className="sr-only">{label}</span>
      <div className="h-12 rounded-lg bg-surface-muted animate-pulse" />
      <div className="h-12 rounded-lg bg-surface-muted animate-pulse" />
    </div>
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
