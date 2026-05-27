// src/contest/contest.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contest } from './entities/contest.entity';
import { ContestService } from './contest.service';
import { ContestController } from './contest.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Contest])],
  controllers: [ContestController],
  providers: [ContestService],
  exports: [ContestService],
})
export class ContestModule {}
