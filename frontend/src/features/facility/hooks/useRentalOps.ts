import { useQuery } from '@tanstack/react-query'
import { listRentals, listStaffMembers, listStaffTasks } from '../api/rentalOpsApi'
import { listTickets } from '../api/supportTicketsApi'
import type {
  Rental,
  RentalFilters,
  RentalSummary,
  StaffTask,
  SupportTicket,
  TaskFilters,
  TaskSummary,
  TicketFilters,
} from '../types'

const EMPTY_RENTAL_SUMMARY: RentalSummary = {
  total: 0,
  byStatus: {
    PENDING_PAYMENT: 0,
    RESERVED: 0,
    ACTIVE: 0,
    OVERDUE: 0,
    RETURNED: 0,
    CANCELLED: 0,
    EXPIRED: 0,
  },
  byTab: { reserved: 0, active: 0, expiring: 0, overdue: 0, ended: 0 },
}

const EMPTY_TASK_SUMMARY: TaskSummary = {
  byStatus: { ASSIGNED: 0, IN_PROGRESS: 0, DONE: 0, CANCELLED: 0 },
  byType: { HANDOVER: 0, RETURN_INSPECTION: 0, UNIT_INSPECTION: 0, SUPPORT: 0 },
}

export function useRentals(filters: RentalFilters) {
  const query = useQuery({
    queryKey: ['ops', 'rentals', filters],
    queryFn: () => listRentals(filters),
  })
  return {
    rentals: query.data?.items ?? ([] as Rental[]),
    summary: query.data?.summary ?? EMPTY_RENTAL_SUMMARY,
    loading: query.isPending,
    error: query.error ? 'Không tải được danh sách hợp đồng. Vui lòng thử lại.' : null,
    reload: query.refetch,
  }
}

export function useStaffTasks(filters: TaskFilters) {
  const query = useQuery({
    queryKey: ['ops', 'tasks', filters],
    queryFn: () => listStaffTasks(filters),
  })
  return {
    tasks: query.data?.items ?? ([] as StaffTask[]),
    summary: query.data?.summary ?? EMPTY_TASK_SUMMARY,
    loading: query.isPending,
    error: query.error ? 'Không tải được danh sách công việc. Vui lòng thử lại.' : null,
    reload: query.refetch,
  }
}

export function useStaffMembers(facilityId: number) {
  const query = useQuery({
    queryKey: ['ops', 'staff', facilityId],
    queryFn: () => listStaffMembers(facilityId),
  })
  return { staff: query.data ?? [] }
}

export function useTickets(filters: TicketFilters) {
  const query = useQuery({
    queryKey: ['ops', 'tickets', filters],
    queryFn: () => listTickets(filters),
  })
  return {
    tickets: query.data?.items ?? ([] as SupportTicket[]),
    activeCount: query.data?.activeCount ?? 0,
    loading: query.isPending,
    error: query.error ? 'Không tải được danh sách ticket. Vui lòng thử lại.' : null,
    reload: query.refetch,
  }
}
