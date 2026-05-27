import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Submission } from 'src/submissions/entities/submission.entity';
import { Contest } from 'src/contest/entities/contest.entity';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardGateway } from './leaderboard.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Submission, Contest]),
  ],
  providers: [LeaderboardService, LeaderboardGateway],
  exports: [LeaderboardGateway],   // SubmissionsModule imports this to call broadcastLeaderboard
})
export class LeaderboardModule {}
