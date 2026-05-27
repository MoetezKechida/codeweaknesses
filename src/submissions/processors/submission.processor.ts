import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { Submission, SubmissionStatus } from '../entities/submission.entity';
import { TestResult } from '../entities/test-result.entity';
import { JudgeEngineService } from '../judge/judge-engine.service';
import { TestCase } from 'src/problem/entities/test-case.entity';
import { SubmissionSseService } from '../../sse/submission-sse.service';
import { SseEventType } from '../../sse/sse-events.types';
@Injectable()
export class SubmissionProcessor {
  constructor(
    @InjectRepository(Submission)
    private submissionsRepository: Repository<Submission>,
    @InjectRepository(TestResult)
    private testResultsRepository: Repository<TestResult>,
    @InjectRepository(TestCase)
    private testCasesRepository: Repository<TestCase>,
    private judgeEngineService: JudgeEngineService,
    private sseService: SubmissionSseService,
  ) {}

  async processSubmission(job: Job): Promise<any> {
    const submissionId = job.data.submissionId;
    const { code, language, problemId } = job.data;

    try {
      // Fetch submission from database
      const submission = await this.submissionsRepository.findOne({
        where: { id: submissionId },
        relations: {
          problem: true,
          user: true,
        },
      });

      if (!submission) {
        throw new Error(`Submission ${submissionId} not found`);
      }

      // Update status to RUNNING
      submission.status = SubmissionStatus.RUNNING;
      submission.startedAt = new Date();
      await this.submissionsRepository.save(submission);

      // Fetch test cases for the problem
      const testCases = await this.testCasesRepository.find({
        where: { problemId },
        order: { orderIndex: 'ASC' },
      });

      const visibleTestCases = testCases.filter(
        (testCase) => !testCase.isHidden,
      );
      const hiddenTestCases = testCases.filter((testCase) => testCase.isHidden);

      // Execute code against each test case
      let passedCount = 0;
      let totalExecutionTime = 0;
      let maxMemoryUsed = 0;
      let visibleCasesPassed = true;

      if (testCases.length === 0) {
        throw new Error('No test cases found for this problem');
      }

      const runTestCase = async (
        testCase: TestCase,
        index: number,
      ): Promise<boolean> => {
        const result = await this.judgeEngineService.executeCode(
          language,
          code,
          testCase.input,
        );

        totalExecutionTime += result.executionTime;
        maxMemoryUsed = Math.max(maxMemoryUsed, result.memoryUsed);

        // Compare output
        const passed =
          result.success &&
          this.judgeEngineService.compareOutput(
            result.output,
            testCase.expectedOutput,
          );

        if (testCase.isHidden) {
          console.log(
            `Hidden test case ${testCase.id}: ${passed ? 'passed' : 'failed'}`,
          );
        } else {
          console.log(`Test case ${testCase.id}:`);
          console.log(`  Output: [${result.output}]`);
          console.log(`  Expected: [${testCase.expectedOutput}]`);
          console.log(`  Passed: ${passed}`);
        }

        if (passed) {
          passedCount++;
        }

        // Create test result record
        await this.testResultsRepository.save({
          submissionId,
          testCaseId: testCase.id,
          passed,
          isHidden: testCase.isHidden,
          output: testCase.isHidden ? null : result.output,
          expectedOutput: testCase.isHidden ? null : testCase.expectedOutput,
          error: result.error ?? null,
          executionTime: result.executionTime,
          memoryUsed: result.memoryUsed,
        } as any);

        this.sseService.push(submissionId, {
          type: SseEventType.TEST_RESULT,
          submissionId,
          testCaseIndex: index,
          testCaseId: testCase.id,
          verdict: passed
            ? 'pass'
            : result.error && result.error.toLowerCase().includes('time')
              ? 'tle'
              : 'fail',
          executionMs: result.executionTime,
          isHidden: testCase.isHidden,
          output: result.error ? (result.output ? result.output + '\n[STDERR]:\n' + result.error : result.error) : result.output,
          expectedOutput: testCase.expectedOutput,
        });

        return passed;
      };

      let currentIndex = 0;
      for (const testCase of visibleTestCases) {
        const passed = await runTestCase(testCase, currentIndex++);
        if (!passed) {
          visibleCasesPassed = false;
        }
      }

      if (!visibleCasesPassed && hiddenTestCases.length > 0) {
        console.log(
          `Skipping ${hiddenTestCases.length} hidden test case(s) after visible test failure.`,
        );
      }

      if (visibleCasesPassed) {
        for (const testCase of hiddenTestCases) {
          const passed = await runTestCase(testCase, currentIndex++);
          if (!passed) {
            console.log(
              `Stopping after first hidden test failure for submission ${submissionId}.`,
            );
            break;
          }
        }
      }

      // Calculate score and determine final status
      const score =
        testCases.length > 0
          ? Math.round((passedCount / testCases.length) * 100)
          : 100;
      let finalStatus = SubmissionStatus.ACCEPTED;

      if (passedCount === 0 && testCases.length > 0) {
        finalStatus = SubmissionStatus.WRONG;
      } else if (passedCount < testCases.length) {
        finalStatus = SubmissionStatus.WRONG;
      }

      // Update submission with results
      submission.status = finalStatus;
      submission.score = score;
      submission.executionTime = totalExecutionTime;
      submission.memoryUsed = maxMemoryUsed;
      submission.completedAt = new Date();

      await this.submissionsRepository.save(submission);

      this.sseService.push(submissionId, {
        type: SseEventType.SUBMISSION_COMPLETED,
        submissionId,
        finalVerdict: finalStatus,
        score,
        totalExecutionMs: totalExecutionTime,
        passedCount,
        totalCount: testCases.length,
      });
      this.sseService.complete(submissionId);

      console.log(
        `Submission ${submissionId} completed: ${passedCount}/${testCases.length} tests passed, score: ${score}`,
      );
      return { success: true, submissionId, score, passedCount };
    } catch (error: any) {
      console.error(`Error processing submission ${submissionId}:`, error);

      this.sseService.error(submissionId, error.message || 'Internal error');

      // Update submission status to ERROR
      const submission = await this.submissionsRepository.findOne({
        where: { id: submissionId },
      });

      if (submission) {
        submission.status = SubmissionStatus.RUNTIME_ERROR;
        submission.completedAt = new Date();
        await this.submissionsRepository.save(submission);
      }

      throw error;
    }
  }
}
