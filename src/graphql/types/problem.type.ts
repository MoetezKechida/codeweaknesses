import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ProblemType {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field(() => Int)
  timeLimitMs: number;
}
