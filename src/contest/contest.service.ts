import { Injectable } from '@nestjs/common';

import { Contest } from './entities/contest.entity';
import { BaseService } from 'src/commun/generic-crud.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ContestService extends BaseService<Contest> {
  constructor(
    @InjectRepository(Contest)
    private readonly contestRepository: Repository<Contest>,
  ) {
    super(contestRepository);
  }
}
