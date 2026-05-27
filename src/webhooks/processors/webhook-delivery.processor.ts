import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { WebhooksService } from '../webhooks.service';
import { QueueService } from 'src/queue/queue.service';
import { WebhookDeliveryStatus } from '../entities/webhook-delivery.entity';

type WebhookDeliveryJob = {
  deliveryId: string;
  attempt: number;
};

@Injectable()
export class WebhookDeliveryProcessor {
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly queueService: QueueService,
  ) {}

  async process(job: Job<WebhookDeliveryJob>): Promise<void> {
    const { deliveryId, attempt } = job.data;
    const delivery = await this.webhooksService.findDelivery(deliveryId);

    if (!delivery) {
      return;
    }

    const subscription = delivery.subscription;
    const payload = JSON.parse(delivery.payload) as unknown;
    const result = await this.webhooksService.tryDeliver(subscription, payload, delivery);

    if (result.status === WebhookDeliveryStatus.SENT) {
      return;
    }

    if (attempt >= 3) {
      await this.webhooksService.markDeliveryFailed(delivery.id, result.responseCode);
      return;
    }

    const nextAttempt = attempt + 1;
    const delayMs = this.webhooksService.getRetryDelayMs(nextAttempt);
    await this.webhooksService.markDeliveryRetrying(delivery.id, nextAttempt, result.responseCode);
    await this.queueService.enqueueWebhookDelivery(`${delivery.id}:${nextAttempt}`, {
      deliveryId,
      attempt: nextAttempt,
    }, delayMs);
  }
}