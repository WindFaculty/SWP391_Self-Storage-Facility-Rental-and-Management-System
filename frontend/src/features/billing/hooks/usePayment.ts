import { useMutation, useQuery } from '@tanstack/react-query';
import { paymentApi } from '../api/paymentApi';

export const useCreateVnPayUrl = () =>
  useMutation({
    mutationFn: (invoiceId: string) => paymentApi.createVnPayUrl(invoiceId),
  });

export const usePaymentAttempt = (reference: string) =>
  useQuery({
    queryKey: ['payment-attempt', reference],
    queryFn: () => paymentApi.getAttempt(reference),
    enabled: Boolean(reference),
    retry: false,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'SUCCESS' || status === 'FAILED' || status === 'RECONCILING') return false;
      return query.state.dataUpdateCount > 10 ? false : 3000;
    },
  });
