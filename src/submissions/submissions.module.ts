import { Module, OnModuleInit, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SubmissionsService } from './submissions.service';
import { SubmissionsController } from './submissions.controller';
import { SubmissionProcessor } from './processors/submission.processor';
import { JudgeEngineService } from './judge/judge-engine.service';
import { QueueModule } from 'src/queue/queue.module';
import { QueueService } from 'src/queue/queue.service';
import { Submission } from './entities/submission.entity';
import { TestResult } from './entities/test-result.entity';
import { Problem } from 'src/problem/entities/problem.entity';
import { Contest } from 'src/contest/entities/contest.entity';
import { User } from 'src/user/entities/user.entity';
import { TestCase } from 'src/problem/entities/test-case.entity';
import { SseModule } from '../sse/sse.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Submission,
      TestResult,
      Problem,
      Contest,
      User,
      TestCase,
    ]),
    QueueModule,
    ConfigModule,
    forwardRef(() => SseModule),
  ],
  providers: [SubmissionsService, SubmissionProcessor, JudgeEngineService],
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
    this.queueService.registerProcessor('submissions', (job) =>
      this.submissionProcessor.processSubmission(job),
    );
  }
}
