import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateSubmissionDto {
  @IsNotEmpty()
  @IsString()
  code!: string;

  @IsNotEmpty()
  @IsString()
  language!: string;

  @IsNotEmpty()
  @IsUUID()
  problemId!: string;

  @IsNotEmpty()
  @IsUUID()
  contestId!: string;
}
