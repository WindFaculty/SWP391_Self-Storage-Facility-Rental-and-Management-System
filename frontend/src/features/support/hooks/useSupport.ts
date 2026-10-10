import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supportApi } from '../api/supportApi';
import type { CreateTicketRequest } from '../types';

export const useMyTickets = () =>
  useQuery({
    queryKey: ['support-tickets', 'me'],
    queryFn: supportApi.listMyTickets,
  });

export const useCreateTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTicketRequest) => supportApi.createTicket(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });
};
