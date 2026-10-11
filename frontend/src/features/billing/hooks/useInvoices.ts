import { useQuery } from '@tanstack/react-query';
import { invoiceApi } from '../api/invoiceApi';

export const useMyInvoices = () =>
  useQuery({
    queryKey: ['invoices', 'me'],
    queryFn: invoiceApi.listMyInvoices,
  });
