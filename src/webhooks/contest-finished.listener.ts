import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contest } from '../contest/entities/contest.entity';
import { Submission } from '../submissions/entities/submission.entity';
import { WebhooksService } from './webhooks.service';
import { QueueService } from 'src/queue/queue.service';

type ContestFinishedEvent = {
  contestId: string;
};

@Injectable()
export class ContestFinishedListener {
  constructor(
    @InjectRepository(Contest)
    private readonly contestsRepository: Repository<Contest>,
    @InjectRepository(Submission)
    private readonly submissionsRepository: Repository<Submission>,
    private readonly webhooksService: WebhooksService,
    private readonly queueService: QueueService,
  ) {}

  @OnEvent('contest.finished')
  async handleContestFinished(event: ContestFinishedEvent) {
    const contest = await this.contestsRepository.findOne({
      where: { id: event.contestId },
    });

    if (!contest) {
      return;
    }

    const submissions = await this.submissionsRepository.find({
      where: { contestId: contest.id },
      relations: { user: true },
      order: { score: 'DESC', completedAt: 'ASC' },
    });

    const winner = submissions[0];
    const payload = {
      contestId: contest.id,
      contestTitle: contest.title,
      winner: winner
        ? {
            name: winner.user?.name ?? 'unknown',
            score: winner.score,
            solveTimeSeconds: winner.completedAt
              ? Math.max(0, Math.round((winner.completedAt.getTime() - contest.startTime.getTime()) / 1000))
              : null,
          }
        : null,
    };

    const subscriptions = await this.webhooksService.findActiveByContestId(contest.id);

    for (const subscription of subscriptions) {
      const delivery = await this.webhooksService.createDelivery(subscription, payload);
      await this.queueService.enqueueWebhookDelivery(`${delivery.id}_1`, {
        deliveryId: delivery.id,
        attempt: 1,
      });
    }
  }
}