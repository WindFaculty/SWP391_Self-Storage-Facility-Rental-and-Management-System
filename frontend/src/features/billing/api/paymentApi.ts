import { apiClient, type ApiResponse } from '../../../api/client';
import type { PaymentAttempt } from '../types';

export interface VnPayUrlResponse {
  paymentUrl: string;
}

export const paymentApi = {
  createVnPayUrl: (invoiceId: string): Promise<VnPayUrlResponse> =>
    apiClient
      .post<ApiResponse<VnPayUrlResponse>>('/payments/vnpay/url', { invoiceId })
      .then((res) => res.data),

  getAttempt: (reference: string): Promise<PaymentAttempt> =>
    apiClient
      .get<ApiResponse<PaymentAttempt>>(`/payments/attempts/${encodeURIComponent(reference)}`)
      .then((res) => res.data),
};
