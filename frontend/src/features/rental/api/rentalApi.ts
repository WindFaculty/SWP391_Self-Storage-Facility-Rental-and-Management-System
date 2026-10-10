import { apiClient, type ApiResponse } from '../../../api/client';
import type {
  HoldRequest,
  HoldResponse,
  RenewalRequest,
  RenewalResponse,
  Rental,
  ReturnRequestPayload,
  ReturnResponse,
} from '../types';

export const rentalApi = {
  createHold: (payload: HoldRequest): Promise<HoldResponse> =>
    apiClient
      .post<ApiResponse<HoldResponse>, HoldRequest>('/rentals/holds', payload)
      .then((res) => res.data),

  listMyRentals: (): Promise<Rental[]> =>
    apiClient.get<ApiResponse<Rental[]>>('/rentals/me').then((res) => res.data),

  cancelRental: (rentalId: string): Promise<Rental> =>
    apiClient
      .post<ApiResponse<Rental>>(`/rentals/${rentalId}/cancel`, {})
      .then((res) => res.data),

  renewRental: (rentalId: string, payload: RenewalRequest): Promise<RenewalResponse> =>
    apiClient
      .post<ApiResponse<RenewalResponse>, RenewalRequest>(`/rentals/${rentalId}/renewals`, payload)
      .then((res) => res.data),

  requestReturn: (rentalId: string, payload: ReturnRequestPayload): Promise<ReturnResponse> =>
    apiClient
      .post<ApiResponse<ReturnResponse>, ReturnRequestPayload>(
        `/rentals/${rentalId}/return-requests`,
        payload,
      )
      .then((res) => res.data),
};
