import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { NotFoundException, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Submission, SubmissionStatus } from 'src/submissions/entities/submission.entity';
import { TestResult } from 'src/submissions/entities/test-result.entity';
import { Problem } from 'src/problem/entities/problem.entity';
import { Contest } from 'src/contest/entities/contest.entity';
import { User, Role } from 'src/user/entities/user.entity';

import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import {
  BestSubmissionType,
  LeaderboardEntryType,
  ProblemBreakdownType,
} from '../types/leaderboard.type';
import { SubmissionType } from '../types/submission.type';
import { TestResultType } from '../types/test-result.type';

interface JwtUser {
  userId: string;
  name: string;
  role: Role;
}

@Resolver()
export class StandingsResolver {
  constructor(
    @InjectRepository(Submission)
    private readonly submissionsRepo: Repository<Submission>,
    @InjectRepository(TestResult)
    private readonly testResultsRepo: Repository<TestResult>,
    @InjectRepository(Problem)
    private readonly problemsRepo: Repository<Problem>,
    @InjectRepository(Contest)
    private readonly contestsRepo: Repository<Contest>,
  ) {}

  
  @Query(() => [LeaderboardEntryType], {
    name: 'contestStandings',
    description:
      'Leaderboard for a contest: ranked users with per-problem best-submission breakdown.',
  })
  async contestStandings(
    @Args('contestId', { type: () => ID }) contestId: string,
  ): Promise<LeaderboardEntryType[]> {
    const contest = await this.contestsRepo.findOne({
      where: { id: contestId },
      relations: { problems: true },
    });
    if (!contest) throw new NotFoundException('Contest not found');

    const problems: Problem[] = contest.problems ?? [];

    
    const submissions = await this.submissionsRepo.find({
      where: { contestId },
      relations: { user: true },
      order: { submittedAt: 'ASC' },
    });

    
    const byUser = new Map<string, { user: User; subs: Submission[] }>();
    for (const sub of submissions) {
      if (!sub.user) continue;
      if (!byUser.has(sub.userId)) {
        byUser.set(sub.userId, { user: sub.user, subs: [] });
      }
      byUser.get(sub.userId)!.subs.push(sub);
    }

    const entries: LeaderboardEntryType[] = [];

    for (const [userId, { user, subs }] of byUser) {
      let totalScore = 0;
      let problemsSolved = 0;
      let lastAcceptedAt: Date | null = null;
      const problemBreakdowns: ProblemBreakdownType[] = [];

      for (const problem of problems) {
        const problemSubs = subs.filter((s) => s.problemId === problem.id);

        if (problemSubs.length === 0) {
          problemBreakdowns.push({
            problemId: problem.id,
            problemTitle: problem.title,
            bestScore: 0,
            attempts: 0,
            bestSubmission: null,
          });
          continue;
        }

        
        const best = problemSubs.reduce((a, b) => {
          if (b.score > a.score) return b;
          if (b.score === a.score && b.submittedAt < a.submittedAt) return b;
          return a;
        });

        totalScore += best.score;

        if (best.status === SubmissionStatus.ACCEPTED) {
          problemsSolved++;
          const acceptedAt = best.completedAt ?? best.submittedAt;
          if (acceptedAt && (!lastAcceptedAt || acceptedAt > lastAcceptedAt)) {
            lastAcceptedAt = acceptedAt;
          }
        }

        const bestSubmission: BestSubmissionType = {
          id: best.id,
          status: best.status,
          score: best.score,
          language: best.language,
          submittedAt: best.submittedAt ?? null,
          executionTime: best.executionTime ?? null,
        };

        problemBreakdowns.push({
          problemId: problem.id,
          problemTitle: problem.title,
          bestScore: best.score,
          attempts: problemSubs.length,
          bestSubmission,
        });
      }

      entries.push({
        rank: 0, // assigned after sort
        userId,
        userName: user.name,
        totalScore,
        problemsSolved,
        lastAcceptedAt,
        problemBreakdowns,
      });
    }

   
    entries.sort((a, b) => {
      if (b.problemsSolved !== a.problemsSolved)
        return b.problemsSolved - a.problemsSolved;
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      const aT = a.lastAcceptedAt?.getTime() ?? Infinity;
      const bT = b.lastAcceptedAt?.getTime() ?? Infinity;
      return aT - bT;
    });

    entries.forEach((e, i) => {
      e.rank = i + 1;
    });

    return entries;
  }

  
  @UseGuards(GqlAuthGuard)
  @Query(() => [SubmissionType], {
    name: 'mySubmissions',
    description: "Authenticated user's submission history for a contest.",
  })
  async mySubmissions(
    @Args('contestId', { type: () => ID }) contestId: string,
    @CurrentUser() caller: JwtUser,
  ): Promise<SubmissionType[]> {
    const submissions = await this.submissionsRepo.find({
      where: { contestId, userId: caller.userId },
      order: { submittedAt: 'DESC' },
    });

    return submissions.map((s) => this.toSubmissionType(s, false, false));
  }


  @UseGuards(GqlAuthGuard)
  @Query(() => SubmissionType, {
    name: 'submissionDetail',
    description:
      'Full submission detail including test results. Hidden test-case output is filtered for non-admins.',
  })
  async submissionDetail(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() caller: JwtUser,
  ): Promise<SubmissionType> {
    const submission = await this.submissionsRepo.findOne({
      where: { id },
      relations: { testResults: true },
    });
    if (!submission) throw new NotFoundException('Submission not found');

    const showHidden = caller.role === Role.ADMIN;
    return this.toSubmissionType(submission, showHidden, true);
  }

 

  private toSubmissionType(
    sub: Submission,
    showHidden: boolean,
    includeTestResults: boolean,
  ): SubmissionType {
    let testResults: TestResultType[] | null = null;

    if (includeTestResults && sub.testResults) {
      testResults = sub.testResults.map((tr) =>
        this.toTestResultType(tr, showHidden),
      );
    }

    return {
      id: sub.id,
      language: sub.language,
      status: sub.status,
      score: sub.score,
      code: sub.code,
      executionTime: sub.executionTime ?? null,
      memoryUsed: sub.memoryUsed ?? null,
      submittedAt: sub.submittedAt ?? null,
      completedAt: sub.completedAt ?? null,
      testResults,
    };
  }

  private toTestResultType(tr: TestResult, showHidden: boolean): TestResultType {
    return {
      id: tr.id,
      testCaseId: tr.testCaseId,
      passed: tr.passed,
      isHidden: tr.isHidden,
      output: tr.isHidden && !showHidden ? null : tr.output,
      expectedOutput: tr.isHidden && !showHidden ? null : tr.expectedOutput,
      error: tr.error,
      executionTime: tr.executionTime,
      memoryUsed: tr.memoryUsed,
    };
  }
}
