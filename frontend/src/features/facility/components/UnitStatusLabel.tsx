import { UNIT_STATUS_LABELS } from '../unitRules'
import type { UnitStatus } from '../types'

const STATUS_DOT: Record<UnitStatus, string> = {
  AVAILABLE: 'bg-success',
  OCCUPIED: 'bg-info',
  INSPECTION: 'bg-warning',
  MAINTENANCE: 'bg-danger',
}

export function UnitStatusLabel({ status }: { status: UnitStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-label-help text-text-main">
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} aria-hidden="true" />
      {UNIT_STATUS_LABELS[status]}
    </span>
  )
}
