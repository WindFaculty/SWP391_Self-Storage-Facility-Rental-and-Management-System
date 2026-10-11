import type { InvoiceSummary } from '../billing/types';

export type RentalStatus =
  | 'PENDING_PAYMENT'
  | 'RESERVED'
  | 'ACTIVE'
  | 'RETURN_REQUESTED'
  | 'OVERDUE'
  | 'RETURNED'
  | 'CANCELLED';

export interface Rental {
  id: string;
  status: RentalStatus;
  facilityId: string;
  facilityName?: string | null;
  unitId?: string | null;
  unitCode?: string | null;
  unitTypeId: string;
  unitTypeName?: string | null;
  startDate: string;
  endDate: string;
  monthlyPrice: number;
  holdExpiresAt?: string | null;
  invoiceId?: string | null;
  createdAt?: string | null;
}

export interface HoldRequest {
  facilityId: string;
  unitTypeId: string;
  startDate: string;
  rentalMonths: number;
  note?: string;
}

export interface HoldResponse {
  rental: Rental;
  invoice?: InvoiceSummary | null;
}

export interface RenewalRequest {
  additionalMonths: number;
}

export interface RenewalResponse {
  rental: Rental;
  invoice?: InvoiceSummary | null;
}

export interface ReturnRequestPayload {
  requestedDate?: string;
  note?: string;
}

export interface ReturnResponse {
  rental: Rental;
}
