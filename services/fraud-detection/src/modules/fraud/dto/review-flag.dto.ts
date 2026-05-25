import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum FlagStatus {
  OPEN = 'open',
  REVIEWED = 'reviewed',
  DISMISSED = 'dismissed',
}

export class ReviewFlagDto {
  @ApiProperty({ enum: FlagStatus, description: 'New status for the fraud flag' })
  @IsEnum(FlagStatus)
  status!: FlagStatus;

  @ApiPropertyOptional({ description: 'Reviewer notes or resolution comment', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
