import { api } from '../../../api/api'
import type { Invoice } from '../types'

export const invoiceApi = {
  listMyInvoices: (): Promise<Invoice[]> => api.get('/invoices/me'),
}
