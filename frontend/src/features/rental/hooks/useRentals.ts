import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rentalApi } from '../api/rentalApi';
import type { HoldRequest, RenewalRequest, ReturnRequestPayload } from '../types';

export const useMyRentals = () =>
  useQuery({
    queryKey: ['rentals', 'me'],
    queryFn: rentalApi.listMyRentals,
  });

export const useCreateHold = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: HoldRequest) => rentalApi.createHold(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
    },
  });
};

export const useCancelRental = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rentalId: string) => rentalApi.cancelRental(rentalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
    },
  });
};

export const useRenewRental = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rentalId, payload }: { rentalId: string; payload: RenewalRequest }) =>
      rentalApi.renewRental(rentalId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

export const useRequestReturn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rentalId, payload }: { rentalId: string; payload: ReturnRequestPayload }) =>
      rentalApi.requestReturn(rentalId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
    },
  });
};
