'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api, clearAuthToken, getAuthToken, setAuthToken } from '@/lib/api';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '@/types';

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const hasToken = hasHydrated && !!getAuthToken();

  const getCurrentUserQuery = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      const response = await api.getCurrentUser();
      return response.data as User;
    },
    enabled: hasToken,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await api.login(credentials.name, credentials.password);
      return response.data as AuthResponse;
    },
    onSuccess: (data) => {
      setAuthToken(data.access_token);
      queryClient.setQueryData(['auth', 'user'], data.user);
      router.push('/dashboard');
    },
    onError: (error: any) => {
      console.error(
        'Login error:',
        error.response?.data?.message || error.message,
      );
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const response = await api.register({
        name: data.name,
        password: data.password,
      });
      return response.data as AuthResponse;
    },
    onSuccess: (data) => {
      setAuthToken(data.access_token);
      queryClient.setQueryData(['auth', 'user'], data.user);
      router.push('/dashboard');
    },
    onError: (error: any) => {
      console.error(
        'Register error:',
        error.response?.data?.message || error.message,
      );
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.logout();
    },
    onSuccess: () => {
      clearAuthToken();
      queryClient.removeQueries({ queryKey: ['auth'] });
      router.push('/');
    },
  });

  const isReady =
    hasHydrated && (!hasToken || (!getCurrentUserQuery.isLoading && !getCurrentUserQuery.isPending));
  const isAuthenticated = !!getCurrentUserQuery.data;

  return {
    user: getCurrentUserQuery.data,
    isLoading: getCurrentUserQuery.isLoading,
    isReady,
    isAuthenticated,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
