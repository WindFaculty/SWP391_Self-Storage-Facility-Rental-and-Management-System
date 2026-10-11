import { api } from '../../../api/api'
import type { CreateTicketRequest, SupportTicket } from '../types'

export const supportApi = {
  listMyTickets: (): Promise<SupportTicket[]> => api.get('/support-tickets/me'),

  createTicket: (payload: CreateTicketRequest): Promise<SupportTicket> =>
    api.post('/support-tickets', payload),
}
