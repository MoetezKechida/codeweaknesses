import { Field, GraphQLISODateTime, ID, Int, ObjectType } from '@nestjs/graphql';
import { TestResultType } from './test-result.type';

@ObjectType()
export class SubmissionType {
  @Field(() => ID)
  id: string;

  @Field()
  language: string;

  @Field()
  status: string;

  @Field(() => Int)
  score: number;

  @Field(() => String, { nullable: true })
  code: string | null;

  @Field(() => Int, { nullable: true })
  executionTime: number | null;

  @Field(() => Int, { nullable: true })
  memoryUsed: number | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  submittedAt: Date | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  completedAt: Date | null;

  @Field(() => [TestResultType], { nullable: true })
  testResults: TestResultType[] | null;
}
