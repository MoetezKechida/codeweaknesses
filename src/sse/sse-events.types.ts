export enum SseEventType {
  TEST_RESULT = 'test_result',
  SUBMISSION_COMPLETED = 'submission.completed',
  SUBMISSION_ERROR = 'submission.error',
}

export interface TestResultEvent {
  submissionId: string;
  testCaseIndex: number;
  testCaseId: string;
  verdict: 'pass' | 'fail' | 'tle' | 'mle' | 'error';
  executionMs: number;
  isHidden: boolean;
  output?: string | null;
  expectedOutput?: string | null;
}

export interface SubmissionCompletedEvent {
  submissionId: string;
  finalVerdict: string;
  score: number;
  totalExecutionMs: number;
  passedCount: number;
  totalCount: number;
}
