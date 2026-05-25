// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { ContestModule } from './contest/contest.module';
import { ProblemModule } from './problem/problem.module';
import { AuthModule } from './auth/auth.module';
import { CommunModule } from './commun/commun.module';

const getDatabaseConfig = () => {
  const dbType = process.env.DB_TYPE || 'postgres';

  if (dbType === 'mysql') {
    return {
      type: 'mysql' as const,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'root123',
      database: process.env.DB_NAME || 'codeweaknesses',
      autoLoadEntities: true,
      synchronize: true,
    };
  } else if (dbType === 'postgres') {
    return {
      type: 'postgres' as const,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres123',
      database: process.env.DB_NAME || 'codeweaknesses',
      autoLoadEntities: true,
      synchronize: true,
    };
  } else {
    // Default to SQLite
    return {
      type: 'better-sqlite3' as const,
      database: process.env.DB_DATABASE || 'codeweaknesses.db',
      autoLoadEntities: true,
      synchronize: true,
    };
  }
};

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(getDatabaseConfig()),
    AuthModule,
    ContestModule,
    ProblemModule,
    CommunModule,
  ],
})
export class AppModule {}