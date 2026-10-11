export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  rentalId?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateTicketRequest {
  subject: string;
  description: string;
  rentalId?: string;
  priority?: TicketPriority;
}
