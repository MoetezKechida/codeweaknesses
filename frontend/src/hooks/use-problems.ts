'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Problem, CreateProblemRequest, CreateTestCaseRequest } from '@/types';

export function useProblems(params?: any) {
  return useQuery({
    queryKey: ['problems', params],
    queryFn: async () => {
      const response = await api.getProblems(params);
      return response.data as Problem[];
    },
  });
}

export function useProblem(id: string) {
  return useQuery({
    queryKey: ['problems', id],
    queryFn: async () => {
      const response = await api.getProblem(id);
      return response.data as Problem;
    },
    enabled: !!id,
  });
}

export function useCreateProblem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateProblemRequest) => {
      const response = await api.createProblem(data);
      return response.data as Problem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problems'] });
    },
  });
}

export function useUpdateProblem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.updateProblem(id, data);
      return response.data as Problem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problems'] });
    },
  });
}

export function useDeleteProblem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.deleteProblem(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problems'] });
    },
  });
}

export function useCreateTestCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ problemId, data }: { problemId: string; data: CreateTestCaseRequest }) => {
      const response = await api.createTestCase(problemId, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problems'] });
    },
  });
}
