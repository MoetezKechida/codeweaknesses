import { Injectable } from '@nestjs/common';

import { Problem } from './entities/problem.entity';
import { BaseService } from 'src/commun/generic-crud.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateProblemDto } from './dto/create-problem.dto';


@Injectable()
export class ProblemService extends BaseService<Problem> {
  constructor(@InjectRepository(Problem)
      private readonly problemRepository: Repository<Problem>) {
    super(problemRepository);
  }
  async findByContest(contestId: string): Promise<Problem[]> {
    return this.problemRepository.find({
      where: { contest: { id: contestId } },
      withDeleted: false
    });
  }
  async create(createProblemDto: CreateProblemDto) {
    const { contestId, ...restOfDto } = createProblemDto;
    const problem = this.problemRepository.create({
      ...restOfDto,
      contest: { id: contestId } 
    });

    return this.problemRepository.save(problem);
  }
}
