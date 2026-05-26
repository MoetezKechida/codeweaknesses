import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { SubmissionLanguage } from '../entities/submission.entity';

export class CreateSubmissionDto {
  @IsNotEmpty()
  @IsString()
  code!: string;

  @IsNotEmpty()
  @IsEnum(SubmissionLanguage)
  language!: SubmissionLanguage;

  @IsNotEmpty()
  @IsUUID()
  problemId!: string;

  @IsNotEmpty()
  @IsUUID()
  contestId!: string;
}
