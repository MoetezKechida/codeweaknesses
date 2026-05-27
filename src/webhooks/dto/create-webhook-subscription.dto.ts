import { IsUrl, IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';

export class CreateWebhookSubscriptionDto {
  @IsUrl()
  targetUrl!: string;

  @IsOptional()
  @IsString()
  secret?: string;

  @IsOptional()
  @IsUUID()
  contestId?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
