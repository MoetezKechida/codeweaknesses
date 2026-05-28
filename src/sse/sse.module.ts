import { Module, forwardRef } from '@nestjs/common';
import { SseController } from './sse.controller';
import { SubmissionSseService } from './submission-sse.service';
import { SubmissionsModule } from '../submissions/submissions.module';

@Module({
  imports: [forwardRef(() => SubmissionsModule)],
  controllers: [SseController],
  providers: [SubmissionSseService],
  exports: [SubmissionSseService],
})
export class SseModule {}
