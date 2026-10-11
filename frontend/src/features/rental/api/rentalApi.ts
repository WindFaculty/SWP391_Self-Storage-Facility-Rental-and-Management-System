import { api } from '../../../api/api'
import type {
  HoldRequest,
  HoldResponse,
  RenewalRequest,
  RenewalResponse,
  Rental,
  ReturnRequestPayload,
  ReturnResponse,
} from '../types'

export const rentalApi = {
  createHold: (payload: HoldRequest): Promise<HoldResponse> => api.post('/rentals/holds', payload),

  listMyRentals: (): Promise<Rental[]> => api.get('/rentals/me'),

  cancelRental: (rentalId: string): Promise<Rental> =>
    api.post(`/rentals/${rentalId}/cancel`),

  renewRental: (rentalId: string, payload: RenewalRequest): Promise<RenewalResponse> =>
    api.post(`/rentals/${rentalId}/renewals`, payload),

  requestReturn: (rentalId: string, payload: ReturnRequestPayload): Promise<ReturnResponse> =>
    api.post(`/rentals/${rentalId}/return-requests`, payload),
}
