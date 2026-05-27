'use client';

import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const TOKEN_COOKIE_NAME = 'token';

let axiosInstance: AxiosInstance;

export function getAuthToken(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const tokenCookie = document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${TOKEN_COOKIE_NAME}=`));

  if (!tokenCookie) {
    return null;
  }

  return decodeURIComponent(tokenCookie.slice(TOKEN_COOKIE_NAME.length + 1));
}

export function setAuthToken(token: string) {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie =
    `${TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=86400; samesite=lax`;
}

export function clearAuthToken() {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie =
    `${TOKEN_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; samesite=lax`;
}

export function getApiClient(): AxiosInstance {
  if (!axiosInstance) {
    axiosInstance = axios.create({
      baseURL: API_URL,
    });

    axiosInstance.interceptors.request.use((config) => {
      const token = getAuthToken();

      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    });

    axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          clearAuthToken();

          if (typeof window !== 'undefined') {
            const isAuthPage =
              window.location.pathname === '/login' ||
              window.location.pathname === '/register';

            if (!isAuthPage) {
              window.location.href = '/login';
            }
          }
        }

        return Promise.reject(error);
      },
    );
  }

  return axiosInstance;
}

export const api = {
  login: (name: string, password: string) =>
    getApiClient().post('/auth/login', { name, password }),
  register: (data: { name: string; password: string }) =>
    getApiClient().post('/auth/register', data),
  logout: () => getApiClient().post('/auth/logout'),
  getCurrentUser: () => getApiClient().get('/auth/me'),

  getProblems: (params?: any) => getApiClient().get('/problems', { params }),
  getProblem: (id: string) => getApiClient().get(`/problems/${id}`),
  createProblem: (data: any) => getApiClient().post('/problems', data),
  updateProblem: (id: string, data: any) =>
    getApiClient().patch(`/problems/${id}`, data),
  deleteProblem: (id: string) => getApiClient().delete(`/problems/${id}`),
  createTestCase: (problemId: string, data: any) =>
    getApiClient().post(`/problems/${problemId}/testcases`, data),

  getContests: (params?: any) => getApiClient().get('/contests', { params }),
  getContest: (id: string) => getApiClient().get(`/contests/${id}`),
  createContest: (data: any) => getApiClient().post('/contests', data),
  updateContest: (id: string, data: any) =>
    getApiClient().patch(`/contests/${id}`, data),
  deleteContest: (id: string) => getApiClient().delete(`/contests/${id}`),

  getSubmissions: (params?: any) =>
    getApiClient().get('/submissions', { params }),
  getSubmission: (id: string) => getApiClient().get(`/submissions/${id}`),
  createSubmission: (data: any) => getApiClient().post('/submissions', data),

  getUsers: (params?: any) => getApiClient().get('/users', { params }),
  getUser: (id: string) => getApiClient().get(`/users/${id}`),
  updateUser: (id: string, data: any) =>
    getApiClient().patch(`/users/${id}`, data),
};

export default getApiClient;
