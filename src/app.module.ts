// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ContestModule } from './contest/contest.module';
import { ProblemModule } from './problem/problem.module';
import { AuthModule } from './auth/auth.module';
import { CommunModule } from './commun/commun.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'codeweaknesses',
      autoLoadEntities: true,
      synchronize: true, // development
    }),
    AuthModule,
    ContestModule,
    ProblemModule,
    CommunModule,
  ],
})
export class AppModule {}