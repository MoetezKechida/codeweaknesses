import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { Submission, SubmissionStatus } from '../entities/submission.entity';
import { TestResult } from '../entities/test-result.entity';
import { JudgeEngineService } from '../judge/judge-engine.service';
import { TestCase } from 'src/problem/entities/test-case.entity';

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

      // Execute code against each test case
      let passedCount = 0;
      let totalExecutionTime = 0;
      let maxMemoryUsed = 0;

      for (const testCase of testCases) {
        const result = await this.judgeEngineService.executeCode(
          language,
          code,
          testCase.input,
        );

        totalExecutionTime += result.executionTime;
        maxMemoryUsed = Math.max(maxMemoryUsed, result.memoryUsed);

        // Compare output
        const passed = this.judgeEngineService.compareOutput(
          result.output,
          testCase.expectedOutput,
        );

        // Debug logging
        console.log(`Test case ${testCase.id}:`);
        console.log(`  Output: [${result.output}]`);
        console.log(`  Expected: [${testCase.expectedOutput}]`);
        console.log(`  Passed: ${passed}`);

        if (passed && result.success) {
          passedCount++;
        }

        // Create test result record
        await this.testResultsRepository.save({
          submissionId,
          testCaseId: testCase.id,
          passed: passed && result.success,
          output: result.output,
          expectedOutput: testCase.expectedOutput,
          error: result.error,
          executionTime: result.executionTime,
          memoryUsed: result.memoryUsed,
        } as any);
      }

      // Calculate score and determine final status
      const score =
        testCases.length > 0 ? Math.round((passedCount / testCases.length) * 100) : 100;
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

      console.log(
        `Submission ${submissionId} completed: ${passedCount}/${testCases.length} tests passed, score: ${score}`,
      );
      return { success: true, submissionId, score, passedCount };
    } catch (error) {
      console.error(`Error processing submission ${submissionId}:`, error);

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
