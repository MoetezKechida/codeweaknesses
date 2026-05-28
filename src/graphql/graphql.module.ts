import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Submission } from 'src/submissions/entities/submission.entity';
import { TestResult } from 'src/submissions/entities/test-result.entity';
import { Problem } from 'src/problem/entities/problem.entity';
import { Contest } from 'src/contest/entities/contest.entity';
import { User } from 'src/user/entities/user.entity';

import { StandingsResolver } from './resolvers/standings.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([Submission, TestResult, Problem, Contest, User]),
  ],
  providers: [StandingsResolver],
})
export class GraphqlStandingsModule {}
