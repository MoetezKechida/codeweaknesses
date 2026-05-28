import {
  Controller,
  Get,
  Param,
  Request,
  Res,
  Sse,
  UseGuards,
  ForbiddenException,
  MessageEvent,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Response } from 'express';
import { SubmissionSseService } from './submission-sse.service';
import { SubmissionsService } from '../submissions/submissions.service';
import { SubmissionStatus } from '../submissions/entities/submission.entity';
import {
  SseEventType,
  TestResultEvent,
  SubmissionCompletedEvent,
} from './sse-events.types';

@Controller('sse')
export class SseController {
  constructor(
    private readonly sseService: SubmissionSseService,
    private readonly submissionsService: SubmissionsService,
  ) {}

  private isFinalStatus(status: SubmissionStatus): boolean {
    return [
      SubmissionStatus.ACCEPTED,
      SubmissionStatus.WRONG,
      SubmissionStatus.TLE,
      SubmissionStatus.MLE,
      SubmissionStatus.RUNTIME_ERROR,
      SubmissionStatus.COMPILATION_ERROR,
    ].includes(status);
  }

  @Sse('submission/:id')
  @UseGuards(AuthGuard('jwt'))
  async stream(
    @Param('id') id: string,
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Observable<MessageEvent>> {
    const submission = await this.submissionsService.findOne(id);

    // Authorization: only the owner or an admin can view the stream
    if (submission.userId !== req.user.userId && req.user.role !== 'admin') {
      throw new ForbiddenException(
        'You do not have access to this submission stream',
      );
    }

    const isAdmin = req.user.role === 'admin';

    // late-join: submission already finished
    if (this.isFinalStatus(submission.status)) {
      const replayEvents = this.buildReplayEvents(submission, isAdmin);
      return from(replayEvents);
    }

    // Cleanup on client disconnect
    req.on('close', () => this.sseService.cleanup(id));

    // For active stream, subscribe and filter sensitive information
    return this.sseService
      .getOrCreate(id)
      .asObservable()
      .pipe(
        map((event) => {
          const payload = event.data as any;
          if (payload.type === SseEventType.TEST_RESULT) {
            const testResult = payload as TestResultEvent;
            if (testResult.isHidden && !isAdmin) {
              delete testResult.output;
              delete testResult.expectedOutput;
            }
          }
          return event;
        }),
      );
  }

  private buildReplayEvents(submission: any, isAdmin: boolean): MessageEvent[] {
    const events: MessageEvent[] = [];

    // Replay individual test results
    if (submission.testResults && Array.isArray(submission.testResults)) {
      // Sort by some order or index if needed, assuming they're in insertion order
      submission.testResults.forEach((tr: any, index: number) => {
        const trEvent: TestResultEvent = {
          submissionId: submission.id,
          testCaseIndex: index, // In a real scenario, this should match processor's index
          testCaseId: tr.testCaseId,
          verdict: tr.passed
            ? 'pass'
            : tr.error && tr.error.includes('timeout')
              ? 'tle'
              : 'fail', // Simplified mapping
          executionMs: tr.executionTime || 0,
          isHidden: tr.isHidden,
          output: tr.output,
          expectedOutput: tr.expectedOutput,
        };

        if (tr.isHidden && !isAdmin) {
          delete trEvent.output;
          delete trEvent.expectedOutput;
        }

        events.push({ data: { type: SseEventType.TEST_RESULT, ...trEvent } });
      });
    }

    // Emit final completion event
    const completedEvent: SubmissionCompletedEvent = {
      submissionId: submission.id,
      finalVerdict: submission.status,
      score: submission.score,
      totalExecutionMs: submission.executionTime || 0,
      passedCount:
        submission.testResults?.filter((tr: any) => tr.passed).length || 0,
      totalCount: submission.testResults?.length || 0,
    };

    events.push({
      data: { type: SseEventType.SUBMISSION_COMPLETED, ...completedEvent },
    });

    return events;
  }
}
