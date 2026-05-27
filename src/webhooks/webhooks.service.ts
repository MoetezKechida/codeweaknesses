import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookSubscription } from './entities/webhook-subscription.entity';
import { WebhookDelivery } from './entities/webhook-delivery.entity';
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
      secret: dto.secret ?? null,
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

  async createDelivery(subscription: WebhookSubscription, payload: any) {
    const delivery = this.deliveryRepo.create({
      subscription,
      status: 'pending' as any,
      attempts: 0,
      lastAttemptAt: null,
      responseCode: null,
      payload: JSON.stringify(payload),
    });
    return this.deliveryRepo.save(delivery);
  }
}
