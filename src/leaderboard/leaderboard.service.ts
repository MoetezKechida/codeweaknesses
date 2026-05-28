import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submission, SubmissionStatus } from 'src/submissions/entities/submission.entity';
import { Contest } from 'src/contest/entities/contest.entity';
import {
  LeaderboardEntry,
  LeaderboardPayload,
  ProblemStanding,
} from './dto/leaderboard.dto';

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(
    @InjectRepository(Submission)
    private readonly submissionsRepo: Repository<Submission>,
    @InjectRepository(Contest)
    private readonly contestsRepo: Repository<Contest>,
  ) {}

  /**
   * Compute the full ICPC-style leaderboard for a contest.
   *
   * Scoring rules:
   *  - Solved = at least one ACCEPTED submission for a problem
   *  - Penalty per solved problem = (minutes from contest start to first AC)
   *      + 20 * (wrong/error submissions before first AC on that problem)
   *  - Rank = sorted by (solved DESC, totalPenalty ASC)
   */
  async computeStandings(contestId: string): Promise<LeaderboardPayload> {
    const contest = await this.contestsRepo.findOne({ where: { id: contestId } });
    if (!contest) {
      throw new NotFoundException(`Contest ${contestId} not found`);
    }

    const contestStart = new Date(contest.startTime);

    // Select only the columns needed for standings — avoids loading the code
    // column (potentially several KB per row) and unrelated fields.
    const submissions = await this.submissionsRepo
      .createQueryBuilder('s')
      .select([
        's.id',
        's.userId',
        's.problemId',
        's.status',
        's.submittedAt',
        's.completedAt',
      ])
      .leftJoin('s.user', 'u')
      .addSelect(['u.id', 'u.name'])
      .where('s.contestId = :contestId', { contestId })
      .orderBy('s.submittedAt', 'ASC')
      .getMany();

    // -----------------------------------------------------------------------
    // Group by userId → problemId → submissions[]
    // -----------------------------------------------------------------------
    type SubmissionGroup = Map<string, Map<string, Submission[]>>;
    const byUser: SubmissionGroup = new Map();

    for (const sub of submissions) {
      if (!byUser.has(sub.userId)) {
        byUser.set(sub.userId, new Map());
      }
      const byProblem = byUser.get(sub.userId)!;
      if (!byProblem.has(sub.problemId)) {
        byProblem.set(sub.problemId, []);
      }
      byProblem.get(sub.problemId)!.push(sub);
    }

    // -----------------------------------------------------------------------
    // Build entries
    // -----------------------------------------------------------------------
    const entries: LeaderboardEntry[] = [];

    for (const [userId, byProblem] of byUser) {
      // Grab user name from any submission (they all share the same user)
      const anySubmission = submissions.find((s) => s.userId === userId);
      const userName = anySubmission?.user?.name ?? userId;

      let totalSolved = 0;
      let totalPenalty = 0;
      const problemStandings: Record<string, ProblemStanding> = {};

      for (const [problemId, subs] of byProblem) {
        // Count wrong attempts BEFORE the first accepted submission
        let wrongsBefore = 0;
        let acceptedSub: Submission | undefined;

        for (const sub of subs) {
          if (sub.status === SubmissionStatus.ACCEPTED && !acceptedSub) {
            acceptedSub = sub;
            break; // first AC found — stop counting
          }
          // Only penalise submissions that were definitely wrong / errored
          if (this.isPenalisable(sub.status)) {
            wrongsBefore++;
          }
        }

        if (acceptedSub) {
          const acceptedAt = new Date(acceptedSub.submittedAt ?? acceptedSub.completedAt!);
          const elapsedMs = acceptedAt.getTime() - contestStart.getTime();
          const timeMinutes = Math.max(0, Math.floor(elapsedMs / 60_000));
          const penaltyMinutes = timeMinutes + 20 * wrongsBefore;

          totalSolved++;
          totalPenalty += penaltyMinutes;

          problemStandings[problemId] = {
            problemId,
            solved: true,
            attempts: wrongsBefore,
            acceptedAt,
            timeMinutes,
            penaltyMinutes,
          };
        } else {
          // Never solved; still show attempt count for the UI
          problemStandings[problemId] = {
            problemId,
            solved: false,
            attempts: wrongsBefore,
          };
        }
      }

      entries.push({
        rank: 0, // filled after sort
        userId,
        userName,
        solved: totalSolved,
        totalPenalty,
        problems: problemStandings,
      });
    }

    // -----------------------------------------------------------------------
    // Sort and assign ranks
    // -----------------------------------------------------------------------
    entries.sort((a, b) => {
      if (b.solved !== a.solved) return b.solved - a.solved;       // more solved first
      if (a.totalPenalty !== b.totalPenalty) return a.totalPenalty - b.totalPenalty; // less penalty first
      return a.userName.localeCompare(b.userName);                  // alpha tiebreak
    });

    // Assign ranks (ties share the same rank)
    let currentRank = 1;
    for (let i = 0; i < entries.length; i++) {
      if (
        i > 0 &&
        (entries[i].solved !== entries[i - 1].solved ||
          entries[i].totalPenalty !== entries[i - 1].totalPenalty)
      ) {
        currentRank = i + 1;
      }
      entries[i].rank = currentRank;
    }

    return {
      contestId,
      generatedAt: new Date(),
      entries,
    };
  }

  /** Returns true for statuses that count as wrong attempts (ICPC-style). */
  private isPenalisable(status: SubmissionStatus): boolean {
    return [
      SubmissionStatus.WRONG,
      SubmissionStatus.TLE,
      SubmissionStatus.MLE,
      SubmissionStatus.RUNTIME_ERROR,
      SubmissionStatus.COMPILATION_ERROR,
    ].includes(status);
  }
}
