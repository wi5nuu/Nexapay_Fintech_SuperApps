import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ReviewKycDto {
  @ApiProperty({ description: 'Approve or reject the KYC submission' })
  @IsBoolean()
  approved: boolean;

  @ApiPropertyOptional({ description: 'Reason for rejection (required if rejected)' })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
