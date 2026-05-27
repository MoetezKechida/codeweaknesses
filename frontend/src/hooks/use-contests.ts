'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Contest, CreateContestRequest, UpdateContestRequest } from '@/types';

export function useContests(params?: any) {
  return useQuery({
    queryKey: ['contests', params],
    queryFn: async () => {
      const response = await api.getContests(params);
      return response.data as Contest[];
    },
  });
}

export function useContest(id: string) {
  return useQuery({
    queryKey: ['contests', id],
    queryFn: async () => {
      const response = await api.getContest(id);
      return response.data as Contest;
    },
    enabled: !!id,
  });
}

export function useCreateContest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateContestRequest) => {
      const response = await api.createContest(data);
      return response.data as Contest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
    },
  });
}

export function useUpdateContest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateContestRequest }) => {
      const response = await api.updateContest(id, data);
      return response.data as Contest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
    },
  });
}

export function useDeleteContest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.deleteContest(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
    },
  });
}
