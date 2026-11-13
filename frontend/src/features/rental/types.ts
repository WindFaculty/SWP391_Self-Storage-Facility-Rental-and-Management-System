import type { InvoiceSummary } from '../billing/types';

export type RentalStatus =
  | 'PENDING_PAYMENT'
  | 'RESERVED'
  | 'ACTIVE'
  | 'RETURN_REQUESTED'
  | 'OVERDUE'
  | 'RETURNED'
  | 'CANCELLED';

export type EntityId = string | number

export interface Rental {
  id: EntityId;
  status: RentalStatus;
  facilityId: EntityId;
  facilityName?: string | null;
  unitId?: EntityId | null;
  unitCode?: string | null;
  unitTypeId: EntityId;
  unitTypeName?: string | null;
  startDate: string;
  endDate: string;
  monthlyPrice: number;
  holdExpiresAt?: string | null;
  invoiceId?: EntityId | null;
  createdAt?: string | null;
}

export interface HoldRequest {
  facilityId: EntityId;
  unitTypeId: EntityId;
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
