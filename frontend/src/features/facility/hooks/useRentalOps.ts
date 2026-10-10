import { useCallback, useEffect, useState } from 'react'
import { listRentals, listStaffMembers, listStaffTasks } from '../api/rentalOpsApi'
import { listTickets } from '../api/supportTicketsApi'
import type {
  Rental,
  RentalFilters,
  RentalSummary,
  StaffMember,
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
  const [rentals, setRentals] = useState<Rental[]>([])
  const [summary, setSummary] = useState<RentalSummary>(EMPTY_RENTAL_SUMMARY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { facilityId, tab, search, paymentState, unitTypeId } = filters

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await listRentals({ facilityId, tab, search, paymentState, unitTypeId })
      setRentals(result.items)
      setSummary(result.summary)
    } catch {
      setError('Không tải được danh sách hợp đồng. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [facilityId, tab, search, paymentState, unitTypeId])

  useEffect(() => {
    void reload()
  }, [reload])

  return { rentals, summary, loading, error, reload }
}

export function useStaffTasks(filters: TaskFilters) {
  const [tasks, setTasks] = useState<StaffTask[]>([])
  const [summary, setSummary] = useState<TaskSummary>(EMPTY_TASK_SUMMARY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { facilityId, tab, status, slot, day, rentalId, search } = filters

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await listStaffTasks({ facilityId, tab, status, slot, day, rentalId, search })
      setTasks(result.items)
      setSummary(result.summary)
    } catch {
      setError('Không tải được danh sách công việc. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [facilityId, tab, status, slot, day, rentalId, search])

  useEffect(() => {
    void reload()
  }, [reload])

  return { tasks, summary, loading, error, reload }
}

export function useStaffMembers(facilityId: number) {
  const [staff, setStaff] = useState<StaffMember[]>([])

  useEffect(() => {
    let cancelled = false
    void listStaffMembers(facilityId).then((members) => {
      if (!cancelled) {
        setStaff(members)
      }
    })
    return () => {
      cancelled = true
    }
  }, [facilityId])

  return { staff }
}

export function useTickets(filters: TicketFilters) {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [activeCount, setActiveCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { facilityId, status, search } = filters

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await listTickets({ facilityId, status, search })
      setTickets(result.items)
      setActiveCount(result.activeCount)
    } catch {
      setError('Không tải được danh sách ticket. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [facilityId, status, search])

  useEffect(() => {
    void reload()
  }, [reload])

  return { tickets, activeCount, loading, error, reload }
}
