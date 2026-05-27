import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ContestType {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field(() => GraphQLISODateTime)
  startTime: Date;

  @Field(() => GraphQLISODateTime)
  endTime: Date;
}
