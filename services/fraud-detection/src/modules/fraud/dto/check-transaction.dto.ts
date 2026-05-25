import { IsString, IsNumber, IsOptional, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckTransactionDto {
  @ApiProperty({ description: 'User ID making the transaction', maxLength: 64 })
  @IsString()
  @MaxLength(64)
  userId!: string;

  @ApiProperty({ description: 'Transaction amount', minimum: 0 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ description: 'Currency code', example: 'USD', maxLength: 3 })
  @IsString()
  @MaxLength(3)
  currency!: string;

  @ApiProperty({ description: 'IP address of the requester', maxLength: 45 })
  @IsString()
  @MaxLength(45)
  ipAddress!: string;

  @ApiPropertyOptional({ description: 'Device identifier', default: 'unknown', maxLength: 128 })
  @IsString()
  @IsOptional()
  @MaxLength(128)
  deviceId?: string;

  @ApiPropertyOptional({ description: 'Geographic location', example: 'US-NY', maxLength: 128 })
  @IsString()
  @IsOptional()
  @MaxLength(128)
  location?: string;

  @ApiPropertyOptional({ description: 'Transaction type', default: 'general', maxLength: 32 })
  @IsString()
  @IsOptional()
  @MaxLength(32)
  transactionType?: string;
}
