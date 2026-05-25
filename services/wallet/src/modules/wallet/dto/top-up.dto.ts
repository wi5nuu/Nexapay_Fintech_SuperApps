import { IsString, IsNumber, IsPositive, IsIn, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TopUpDto {
  @ApiProperty({ description: 'User ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID('4')
  userId: string;

  @ApiProperty({ description: 'Amount to deposit (positive decimal)', example: 100.50 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'ISO 4217 currency code', example: 'USD' })
  @IsString()
  @IsIn(['USD', 'EUR', 'GBP', 'NGN', 'KES', 'ZAR', 'GHS', 'XAF', 'XOF'])
  currency: string;

  @ApiProperty({ description: 'Unique idempotency key (UUID v4)', example: '660e8400-e29b-41d4-a716-446655440001' })
  @IsUUID('4')
  idempotencyKey: string;

  @ApiProperty({ description: 'Optional transaction description' })
  @IsString()
  description?: string;
}
