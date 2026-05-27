import { IsString, IsNotEmpty, IsInt, Min, IsUUID } from 'class-validator';

export class CreateProblemDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsInt()
  @Min(100, { message: 'Time limit must be at least 100ms' })
  timeLimitMs!: number;

  @IsUUID()
  @IsNotEmpty()
  contestId!: string;
}
