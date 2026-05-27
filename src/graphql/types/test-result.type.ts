import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class TestResultType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  testCaseId: string;

  @Field()
  passed: boolean;

  @Field()
  isHidden: boolean;

  @Field(() => String, { nullable: true })
  output: string | null;

  @Field(() => String, { nullable: true })
  expectedOutput: string | null;

  @Field(() => String, { nullable: true })
  error: string | null;

  @Field(() => Int, { nullable: true })
  executionTime: number | null;

  @Field(() => Int, { nullable: true })
  memoryUsed: number | null;
}
