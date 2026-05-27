// Auth
export interface LoginRequest {
  name: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface User {
  id: string;
  name: string;
  role: 'user' | 'admin' | 'editor';
  createdAt: string;
  updatedAt: string;
}

// Problems
export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  memoryLimit: number;
  testCases?: TestCase[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProblemRequest {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  memoryLimit: number;
}

export interface TestCase {
  id: string;
  problemId: string;
  input: string;
  output: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTestCaseRequest {
  input: string;
  output: string;
  isPublic: boolean;
}

// Contests
export interface Contest {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  problems?: Problem[];
  participants?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContestRequest {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
}

export interface UpdateContestRequest {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
}

// Submissions
export interface Submission {
  id: string;
  userId: string;
  problemId: string;
  contestId?: string;
  code: string;
  language: string;
  status: 'pending' | 'accepted' | 'rejected' | 'runtime_error' | 'timeout' | 'compilation_error';
  score?: number;
  testResults?: TestResult[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubmissionRequest {
  problemId: string;
  code: string;
  language: string;
  contestId?: string;
}

export interface TestResult {
  id: string;
  submissionId: string;
  testCaseId: string;
  passed: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
  memoryUsed?: number;
  createdAt: string;
  updatedAt: string;
}

// API Response
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  skip?: number;
  take?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
