import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { WebhookSubscription } from './entities/webhook-subscription.entity';
import { WebhookDelivery } from './entities/webhook-delivery.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WebhookSubscription, WebhookDelivery])],
  providers: [WebhooksService],
  controllers: [WebhooksController],
  exports: [WebhooksService],
})
export class WebhooksModule {}
