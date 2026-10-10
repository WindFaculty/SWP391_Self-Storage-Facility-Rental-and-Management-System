import type { Rental, StaffTask, SupportTicket } from '../types'
import { MOCK_RENTALS, MOCK_STAFF_TASKS } from './rentalMockData'
import { MOCK_TICKETS } from './supportMockData'

export const rentalStore: Rental[] = MOCK_RENTALS.map((item) => ({ ...item }))
export const taskStore: StaffTask[] = MOCK_STAFF_TASKS.map((item) => ({ ...item }))
export const ticketStore: SupportTicket[] = MOCK_TICKETS.map((item) => ({ ...item }))

export const idCounters = {
  task: taskStore.reduce((max, item) => Math.max(max, item.id), 0),
}
