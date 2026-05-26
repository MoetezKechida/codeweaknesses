import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateTestCaseDto {
  @IsString()
  @IsNotEmpty()
  input!: string;

  @IsString()
  @IsNotEmpty()
  expectedOutput!: string;

  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  orderIndex?: number;
}
