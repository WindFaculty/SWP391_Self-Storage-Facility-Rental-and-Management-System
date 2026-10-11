import { api } from '../../../api/api'
import type { PaymentAttempt } from '../types'

export interface VnPayUrlResponse {
  paymentUrl: string
}

export const paymentApi = {
  createVnPayUrl: (invoiceId: string): Promise<VnPayUrlResponse> =>
    api.post('/payments/vnpay/url', { invoiceId }),

  getAttempt: (reference: string): Promise<PaymentAttempt> =>
    api.get(`/payments/attempts/${encodeURIComponent(reference)}`),
}
