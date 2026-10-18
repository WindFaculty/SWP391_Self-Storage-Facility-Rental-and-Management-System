export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type SupportTicketCategory = 'UNIT' | 'LOCK' | 'ACCESS' | 'PAYMENT' | 'ITEMS' | 'OTHER';

export interface SupportTicket {
  id: number | string;
  customerId: number | string;
  facilityId: number | string;
  rentalId: number | string | null;
  assignedStaffId: number | string | null;
  category: SupportTicketCategory;
  title: string;
  description: string;
  status: TicketStatus;
  createdAt: string;
  resolvedAt: string | null;
}

export interface CreateTicketRequest {
  facilityId: number;
  rentalId: number;
  category: SupportTicketCategory;
  title: string;
  description: string;
}
