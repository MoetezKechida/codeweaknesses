import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { WebhookSubscription } from './entities/webhook-subscription.entity';
import { WebhookDelivery } from './entities/webhook-delivery.entity';
import { QueueModule } from 'src/queue/queue.module';
import { QueueService } from 'src/queue/queue.service';
import { WebhookDeliveryProcessor } from './processors/webhook-delivery.processor';
import { Contest } from '../contest/entities/contest.entity';
import { Submission } from '../submissions/entities/submission.entity';
import { ContestFinishedListener } from './contest-finished.listener';

@Module({
  imports: [TypeOrmModule.forFeature([WebhookSubscription, WebhookDelivery, Contest, Submission]), QueueModule],
  providers: [WebhooksService, WebhookDeliveryProcessor, ContestFinishedListener],
  controllers: [WebhooksController],
  exports: [WebhooksService],
})
export class WebhooksModule implements OnModuleInit {
  constructor(
    private readonly queueService: QueueService,
    private readonly processor: WebhookDeliveryProcessor,
  ) {}

  onModuleInit() {
    this.queueService.registerProcessor('webhooks', (job) => this.processor.process(job));
  }
}
