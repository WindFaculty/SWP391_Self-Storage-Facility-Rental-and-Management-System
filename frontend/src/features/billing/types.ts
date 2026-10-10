export type InvoiceStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';

export interface InvoiceSummary {
  id: string;
  status: InvoiceStatus;
  rentAmount?: number | null;
  depositAmount?: number | null;
  totalAmount: number;
  dueAt?: string | null;
}

export type PaymentAttemptStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'RECONCILING';

export interface PaymentAttempt {
  reference: string;
  status: PaymentAttemptStatus;
  amount: number;
  invoiceId: string;
  rentalId?: string | null;
}
