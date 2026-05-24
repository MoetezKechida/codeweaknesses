import { Injectable } from '@nestjs/common';

import { Problem } from './entities/problem.entity';
import { BaseService } from 'src/commun/generic-crud.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';


@Injectable()
export class ProblemService extends BaseService<Problem> {
  constructor(@InjectRepository(Problem)
      private readonly problemRepository: Repository<Problem>) {
    super(problemRepository);
  }
}
