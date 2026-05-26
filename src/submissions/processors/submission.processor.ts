import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { Submission, SubmissionStatus } from '../entities/submission.entity';

@Injectable()
export class SubmissionProcessor {
  constructor(
    @InjectRepository(Submission)
    private submissionsRepository: Repository<Submission>,
  ) {}


  async processSubmission(job: Job): Promise<any> {
    const submissionId = job.data.submissionId;

    try {
      console.log(`Processing submission ${submissionId}`);

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

      // TODO: Execute code in sandbox
      // - Run code with timeout
      // - Compare output with expected output
      // - Store test results
      // - Update submission status and score

      // For now, simulate execution
      await this.simulateCodeExecution(submission);

      console.log(`Submission ${submissionId} processed successfully`);
      return { success: true, submissionId };
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

  /**
   * Simulate code execution (placeholder)
   * In production, this will execute code in a Docker sandbox
   */
  private async simulateCodeExecution(submission: Submission): Promise<void> {
    // Simulate execution delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock result - in production, this will be from actual execution
    submission.status = SubmissionStatus.ACCEPTED;
    submission.completedAt = new Date();
    submission.executionTime = 150; // milliseconds
    submission.memoryUsed = 4096; // bytes
    submission.score = 100;

    await this.submissionsRepository.save(submission);
  }
}
