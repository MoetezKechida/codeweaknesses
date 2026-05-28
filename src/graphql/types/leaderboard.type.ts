import { Field, GraphQLISODateTime, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class BestSubmissionType {
  @Field(() => ID)
  id: string;

  @Field()
  status: string;

  @Field(() => Int)
  score: number;

  @Field()
  language: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  submittedAt: Date | null;

  @Field(() => Int, { nullable: true })
  executionTime: number | null;
}

@ObjectType()
export class ProblemBreakdownType {
  @Field(() => ID)
  problemId: string;

  @Field()
  problemTitle: string;

  @Field(() => Int)
  bestScore: number;

  @Field(() => Int)
  attempts: number;

  @Field(() => BestSubmissionType, { nullable: true })
  bestSubmission: BestSubmissionType | null;
}

@ObjectType()
export class LeaderboardEntryType {
  @Field(() => Int)
  rank: number;

  @Field(() => ID)
  userId: string;

  @Field()
  userName: string;

  @Field(() => Int)
  totalScore: number;

  @Field(() => Int)
  problemsSolved: number;

  @Field(() => GraphQLISODateTime, { nullable: true })
  lastAcceptedAt: Date | null;

  @Field(() => [ProblemBreakdownType])
  problemBreakdowns: ProblemBreakdownType[];
}
