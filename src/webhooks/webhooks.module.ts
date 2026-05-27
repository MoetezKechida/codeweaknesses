import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { WebhookSubscription } from './entities/webhook-subscription.entity';
import { WebhookDelivery } from './entities/webhook-delivery.entity';
import { QueueModule } from 'src/queue/queue.module';
import { QueueService } from 'src/queue/queue.service';
import { WebhookDeliveryProcessor } from './processors/webhook-delivery.processor';
import { OnModuleInit } from '@nestjs/common';

@Module({
  imports: [TypeOrmModule.forFeature([WebhookSubscription, WebhookDelivery]), QueueModule],
  providers: [WebhooksService, WebhookDeliveryProcessor],
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
