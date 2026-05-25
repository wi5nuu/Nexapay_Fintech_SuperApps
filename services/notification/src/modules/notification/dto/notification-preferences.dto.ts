import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ChannelPreferencesDto {
  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  email?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  sms?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  push?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  inApp?: boolean;
}

export class NotificationPreferencesDto {
  @ApiProperty({ description: 'User ID' })
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({ description: 'Wallet notification channels' })
  @ValidateNested()
  @Type(() => ChannelPreferencesDto)
  @IsOptional()
  wallet?: ChannelPreferencesDto;

  @ApiPropertyOptional({ description: 'Loan notification channels' })
  @ValidateNested()
  @Type(() => ChannelPreferencesDto)
  @IsOptional()
  loan?: ChannelPreferencesDto;

  @ApiPropertyOptional({ description: 'KYC notification channels' })
  @ValidateNested()
  @Type(() => ChannelPreferencesDto)
  @IsOptional()
  kyc?: ChannelPreferencesDto;

  @ApiPropertyOptional({ description: 'Fraud alert channels' })
  @ValidateNested()
  @Type(() => ChannelPreferencesDto)
  @IsOptional()
  fraud?: ChannelPreferencesDto;

  @ApiPropertyOptional({ description: 'Investment notification channels' })
  @ValidateNested()
  @Type(() => ChannelPreferencesDto)
  @IsOptional()
  investment?: ChannelPreferencesDto;

  @ApiPropertyOptional({ description: 'Marketing notification channels' })
  @ValidateNested()
  @Type(() => ChannelPreferencesDto)
  @IsOptional()
  marketing?: ChannelPreferencesDto;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  doNotDisturb?: boolean;

  @ApiPropertyOptional({ description: 'Quiet hours range e.g. { start: "22:00", end: "07:00" }' })
  @IsObject()
  @IsOptional()
  quietHours?: { start: string; end: string };
}
