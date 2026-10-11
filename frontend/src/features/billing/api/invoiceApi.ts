import { apiClient, type ApiResponse } from '../../../api/client';
import type { Invoice } from '../types';

export const invoiceApi = {
  listMyInvoices: (): Promise<Invoice[]> =>
    apiClient.get<ApiResponse<Invoice[]>>('/invoices/me').then((res) => res.data),
};
