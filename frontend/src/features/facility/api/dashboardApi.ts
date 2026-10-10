import { MOCK_UNIT_TYPES } from './mockData'
import { listUnits } from './facilityUnitsApi'
import { listRentals, listStaffTasks } from './rentalOpsApi'
import { listTickets } from './supportTicketsApi'
import { isRentalExpiring } from '../rentalRules'
import { isTicketActive } from '../supportRules'
import type { Rental } from '../types'

export interface DashboardAttentionItem {
  id: string
  severity: 'danger' | 'warning' | 'info'
  title: string
  detail: string
  path: string
}

export interface OccupancyByType {
  name: string
  occupied: number
  total: number
  rate: number
}

export interface FacilityDashboard {
  unitTotal: number
  unitOccupied: number
  unitAvailable: number
  unitInspection: number
  unitMaintenance: number
  occupancyRate: number
  activeRentals: number
  overdueRentals: number
  expiringRentals: number
  tasksToday: number
  tasksOpen: number
  activeTickets: number
  attention: DashboardAttentionItem[]
  expiringRentalList: Rental[]
  occupancyByType: OccupancyByType[]
}

export async function getFacilityDashboard(facilityId: number): Promise<FacilityDashboard> {
  const now = new Date()
  const [unitsResult, rentalsResult, tasksResult, ticketsResult] = await Promise.all([
    listUnits({ facilityId, search: '', unitTypeId: null, status: null, priceBand: null }),
    listRentals({ facilityId, tab: 'all', search: '', paymentState: null, unitTypeId: null }),
    listStaffTasks({
      facilityId,
      tab: 'all',
      status: null,
      slot: 'all',
      day: 'today',
      rentalId: null,
      search: '',
    }),
    listTickets({ facilityId, status: null, search: '' }),
  ])

  const units = unitsResult.items
  const unitSummary = unitsResult.summary
  const rentals = rentalsResult.items
  const expiring = rentals.filter((rental) => isRentalExpiring(rental, now))
  const overdue = rentals.filter((rental) => rental.status === 'OVERDUE')
  const unpaid = rentals.filter(
    (rental) =>
      (rental.status === 'PENDING_PAYMENT' || rental.status === 'RESERVED') &&
      rental.paymentState !== 'PAID',
  )
  const unitChecks = units.filter(
    (unit) => unit.status === 'INSPECTION' || unit.status === 'MAINTENANCE',
  )
  const activeTickets = ticketsResult.items.filter(isTicketActive)

  const attention: DashboardAttentionItem[] = []
  overdue.forEach((rental) => {
    attention.push({
      id: `overdue-${rental.id}`,
      severity: 'danger',
      title: `Hợp đồng #${rental.id} quá hạn`,
      detail: `${rental.customerName} • Kho ${rental.unitCode} • ${
        rental.paymentState === 'OVERDUE' ? 'Quá hạn thanh toán' : 'Chờ trả kho'
      }`,
      path: '/facility/rentals',
    })
  })
  unpaid.forEach((rental) => {
    attention.push({
      id: `unpaid-${rental.id}`,
      severity: 'warning',
      title: `Hợp đồng #${rental.id} chưa thanh toán đủ`,
      detail: `${rental.customerName} • Kho ${rental.unitCode}`,
      path: '/facility/rentals',
    })
  })
  expiring.slice(0, 3).forEach((rental) => {
    attention.push({
      id: `expiring-${rental.id}`,
      severity: 'warning',
      title: `Hợp đồng #${rental.id} sắp hết hạn`,
      detail: `${rental.customerName} • Kho ${rental.unitCode} • đến ${rental.endDate}`,
      path: '/facility/rentals',
    })
  })
  unitChecks.slice(0, 3).forEach((unit) => {
    attention.push({
      id: `unit-${unit.id}`,
      severity: 'info',
      title: `Kho ${unit.unitCode} cần kiểm tra / bảo trì`,
      detail: `${unit.locationLabel} • ${unit.status === 'INSPECTION' ? 'Đang kiểm tra' : 'Đang bảo trì'}`,
      path: '/facility/units',
    })
  })
  activeTickets.slice(0, 3).forEach((ticket) => {
    attention.push({
      id: `ticket-${ticket.id}`,
      severity: 'info',
      title: `Ticket #${ticket.id} đang xử lý`,
      detail: `${ticket.customerName} • ${ticket.title}`,
      path: '/staff/operations',
    })
  })

  const occupancyByType: OccupancyByType[] = MOCK_UNIT_TYPES.map((unitType) => {
    const typeUnits = units.filter((unit) => unit.unitTypeId === unitType.id)
    const occupied = typeUnits.filter((unit) => unit.status === 'OCCUPIED').length
    return {
      name: unitType.name,
      occupied,
      total: typeUnits.length,
      rate: typeUnits.length > 0 ? Math.round((occupied / typeUnits.length) * 1000) / 10 : 0,
    }
  }).filter((item) => item.total > 0)

  const tasksSummary = tasksResult.summary
  return {
    unitTotal: unitSummary.total,
    unitOccupied: unitSummary.byStatus.OCCUPIED,
    unitAvailable: unitSummary.byStatus.AVAILABLE,
    unitInspection: unitSummary.byStatus.INSPECTION,
    unitMaintenance: unitSummary.byStatus.MAINTENANCE,
    occupancyRate:
      unitSummary.total > 0
        ? Math.round((unitSummary.byStatus.OCCUPIED / unitSummary.total) * 1000) / 10
        : 0,
    activeRentals: rentalsResult.summary.byStatus.ACTIVE,
    overdueRentals: rentalsResult.summary.byStatus.OVERDUE,
    expiringRentals: rentalsResult.summary.byTab.expiring,
    tasksToday:
      tasksSummary.byStatus.ASSIGNED +
      tasksSummary.byStatus.IN_PROGRESS +
      tasksSummary.byStatus.DONE +
      tasksSummary.byStatus.CANCELLED,
    tasksOpen: tasksSummary.byStatus.ASSIGNED + tasksSummary.byStatus.IN_PROGRESS,
    activeTickets: activeTickets.length,
    attention,
    expiringRentalList: expiring,
    occupancyByType,
  }
}
