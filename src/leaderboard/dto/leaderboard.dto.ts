/** Per-problem breakdown for one contestant */
export interface ProblemStanding {
  problemId: string;
  /** Whether this contestant has an accepted submission for this problem */
  solved: boolean;
  /** Total wrong/error submissions before first acceptance (0 when not solved) */
  attempts: number;
  /** Wall-clock timestamp of the first accepted submission (undefined when not solved) */
  acceptedAt?: Date;
  /**
   * Minutes elapsed from contest start to acceptance.
   * Undefined when not solved.
   */
  timeMinutes?: number;
  /**
   * ICPC penalty for this problem:
   *   timeMinutes + 20 * attempts_before_acceptance
   * Undefined when not solved.
   */
  penaltyMinutes?: number;
}

/** One row in the live leaderboard */
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  /** Number of distinct problems solved */
  solved: number;
  /**
   * Total ICPC penalty across all solved problems.
   * Lower is better.
   */
  totalPenalty: number;
  /** Problem-level breakdown keyed by problemId */
  problems: Record<string, ProblemStanding>;
}

/** Full leaderboard payload broadcasted to a contest room */
export interface LeaderboardPayload {
  contestId: string;
  generatedAt: Date;
  entries: LeaderboardEntry[];
}
