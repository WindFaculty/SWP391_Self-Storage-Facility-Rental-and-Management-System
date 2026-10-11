import { withQuery, workspaceClient } from '../../../api/workspaceClient'
import type { StaffTask, SupportTicket, TicketFilters } from '../types'

export interface AssignTicketInput { facilityId: number; ticketId: number; staffId: number; scheduledAt: string; notes?: string }
export const listTickets = (filters: TicketFilters): Promise<{ items: SupportTicket[]; activeCount: number }> => workspaceClient.get(withQuery('/ops/tickets', filters))
export const getTicket = (id: number): Promise<SupportTicket> => workspaceClient.get(`/ops/tickets/${id}`)
export const assignTicket = ({ ticketId, ...input }: AssignTicketInput): Promise<{ ticket: SupportTicket; task: StaffTask }> => workspaceClient.post(`/ops/tickets/${ticketId}/assign`, input)
export const closeTicket = (ticketId: number): Promise<SupportTicket> => workspaceClient.post(`/ops/tickets/${ticketId}/close`, {})
