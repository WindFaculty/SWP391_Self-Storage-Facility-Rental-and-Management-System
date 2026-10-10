import { apiClient, type ApiResponse } from '../../../api/client';
import type { HoldRequest, HoldResponse, Rental } from '../types';

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
};
