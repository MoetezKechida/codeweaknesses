'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Submission, CreateSubmissionRequest } from '@/types';

export function useSubmissions(params?: any) {
  return useQuery({
    queryKey: ['submissions', params],
    queryFn: async () => {
      const response = await api.getSubmissions(params);
      return response.data as Submission[];
    },
  });
}

export function useSubmission(id: string) {
  return useQuery({
    queryKey: ['submissions', id],
    queryFn: async () => {
      const response = await api.getSubmission(id);
      return response.data as Submission;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      // Refetch if submission is still pending
      const data = query.state?.data;
      if (data && typeof data === 'object' && 'status' in data && data.status === 'pending') {
        return 2000; // Refetch every 2 seconds
      }
      return false;
    },
  });
}

export function useCreateSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSubmissionRequest) => {
      const response = await api.createSubmission(data);
      return response.data as Submission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}
