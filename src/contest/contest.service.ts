import { Injectable, OnModuleInit } from '@nestjs/common';

import { Contest } from './entities/contest.entity';
import { BaseService } from 'src/commun/generic-crud.service';
import { IsNull, LessThanOrEqual, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ContestService extends BaseService<Contest> implements OnModuleInit {
  constructor(@InjectRepository(Contest)
      private readonly contestRepository: Repository<Contest>,
      private readonly eventEmitter: EventEmitter2) {
    super(contestRepository);
  }

  onModuleInit() {
    const intervalHandle = setInterval(() => {
      void this.finishExpiredContests();
    }, 60000);

    intervalHandle.unref();
  }

  async finishContest(id: string) {
    const contest = await this.contestRepository.findOne({ where: { id } });
    if (!contest) {
      return null;
    }

    if (!contest.finishedAt) {
      contest.finishedAt = new Date();
      await this.contestRepository.save(contest);
    }

    this.eventEmitter.emit('contest.finished', { contestId: contest.id });
    return contest;
  }

  async finishExpiredContests() {
    const now = new Date();
    const expiredContests = await this.contestRepository.find({
      where: {
        finishedAt: IsNull(),
        endTime: LessThanOrEqual(now),
      },
    });

    for (const contest of expiredContests) {
      contest.finishedAt = now;
      await this.contestRepository.save(contest);
      this.eventEmitter.emit('contest.finished', { contestId: contest.id });
    }
  }
}
