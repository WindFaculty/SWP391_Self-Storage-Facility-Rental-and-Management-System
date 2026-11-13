import { api } from '../../../api/api'
import type {
  EntityId,
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

  cancelRental: (rentalId: EntityId): Promise<Rental> =>
    api.post(`/rentals/${rentalId}/cancel`),

  renewRental: (rentalId: EntityId, payload: RenewalRequest): Promise<RenewalResponse> =>
    api.post(`/rentals/${rentalId}/renewals`, payload),

  requestReturn: (rentalId: EntityId, payload: ReturnRequestPayload): Promise<ReturnResponse> =>
    api.post(`/rentals/${rentalId}/return-requests`, payload),
}
