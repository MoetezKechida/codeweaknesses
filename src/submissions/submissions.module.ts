import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionsService } from './submissions.service';
import { SubmissionsController } from './submissions.controller';
import { SubmissionProcessor } from './processors/submission.processor';
import { QueueModule } from 'src/queue/queue.module';
import { QueueService } from 'src/queue/queue.service';
import { Submission } from './entities/submission.entity';
import { TestResult } from './entities/test-result.entity';
import { Problem } from 'src/problem/entities/problem.entity';
import { Contest } from 'src/contest/entities/contest.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Submission, TestResult, Problem, Contest, User]),
    QueueModule,
  ],
  providers: [SubmissionsService, SubmissionProcessor],
  controllers: [SubmissionsController],
  exports: [SubmissionsService],
})
export class SubmissionsModule implements OnModuleInit {
  constructor(
    private queueService: QueueService,
    private submissionProcessor: SubmissionProcessor,
  ) {}

  onModuleInit() {
    // Register the submission processor with the queue
    this.queueService.registerProcessor(
      'submissions',
      (job) => this.submissionProcessor.processSubmission(job),
    );
  }
}
