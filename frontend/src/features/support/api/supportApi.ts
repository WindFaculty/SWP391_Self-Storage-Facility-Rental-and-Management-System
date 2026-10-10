import { apiClient, type ApiResponse } from '../../../api/client';
import type { CreateTicketRequest, SupportTicket } from '../types';

export const supportApi = {
  listMyTickets: (): Promise<SupportTicket[]> =>
    apiClient.get<ApiResponse<SupportTicket[]>>('/support-tickets/me').then((res) => res.data),

  createTicket: (payload: CreateTicketRequest): Promise<SupportTicket> =>
    apiClient
      .post<ApiResponse<SupportTicket>, CreateTicketRequest>('/support-tickets', payload)
      .then((res) => res.data),
};
