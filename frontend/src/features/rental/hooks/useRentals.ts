import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rentalApi } from '../api/rentalApi';
import type { HoldRequest } from '../types';

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
