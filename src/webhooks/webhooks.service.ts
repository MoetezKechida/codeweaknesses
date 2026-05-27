import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { WebhookSubscription } from './entities/webhook-subscription.entity';
import { WebhookDelivery, WebhookDeliveryStatus } from './entities/webhook-delivery.entity';
import { CreateWebhookSubscriptionDto } from './dto/create-webhook-subscription.dto';

@Injectable()
export class WebhooksService {
  constructor(
    @InjectRepository(WebhookSubscription)
    private readonly subsRepo: Repository<WebhookSubscription>,
    @InjectRepository(WebhookDelivery)
    private readonly deliveryRepo: Repository<WebhookDelivery>,
  ) {}

  async create(dto: CreateWebhookSubscriptionDto) {
    const sub = this.subsRepo.create({
      targetUrl: dto.targetUrl,
      secret: dto.secret ?? randomBytes(32).toString('hex'),
      contestId: dto.contestId ?? null,
      active: dto.active ?? true,
    });
    return this.subsRepo.save(sub);
  }

  async findAll() {
    return this.subsRepo.find();
  }

  async findOne(id: string) {
    const s = await this.subsRepo.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Subscription not found');
    return s;
  }

  signPayload(secret: string, payload: string): string {
    const digest = createHmac('sha256', secret).update(payload).digest('hex');
    return `sha256=${digest}`;
  }

  private snapshotPayload(payload: unknown): string {
    return typeof payload === 'string' ? payload : JSON.stringify(payload);
  }

  async createDelivery(subscription: WebhookSubscription, payload: unknown) {
    const snapshot = this.snapshotPayload(payload);
    const delivery = this.deliveryRepo.create({
      subscription,
      status: WebhookDeliveryStatus.PENDING,
      attempts: 0,
      lastAttemptAt: null,
      responseCode: null,
      payload: snapshot,
    });
    return this.deliveryRepo.save(delivery);
  }

  async deliver(subscription: WebhookSubscription, payload: unknown) {
    const payloadSnapshot = this.snapshotPayload(payload);
    const delivery = await this.createDelivery(subscription, payloadSnapshot);
    const signature = this.signPayload(subscription.secret ?? '', payloadSnapshot);

    let responseCode: number | null = null;
    let status = WebhookDeliveryStatus.FAILED;

    try {
      const response = await fetch(subscription.targetUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-signature-256': signature,
        },
        body: payloadSnapshot,
      });

      responseCode = response.status;
      status = response.ok ? WebhookDeliveryStatus.SENT : WebhookDeliveryStatus.FAILED;
    } catch {
      status = WebhookDeliveryStatus.FAILED;
    }

    await this.deliveryRepo.update(delivery.id, {
      status,
      attempts: 1,
      lastAttemptAt: new Date(),
      responseCode,
    });

    return this.deliveryRepo.findOne({ where: { id: delivery.id } });
  }
}
