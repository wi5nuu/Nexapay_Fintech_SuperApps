import { IsString, IsNumber, IsPositive, IsIn, IsUUID, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransferDto {
  @ApiProperty({ description: 'Sender wallet ID' })
  @IsUUID('4')
  fromWalletId: string;

  @ApiProperty({ description: 'Recipient wallet ID' })
  @IsUUID('4')
  toWalletId: string;

  @ApiProperty({ description: 'Transfer amount (positive decimal)', example: 50.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'ISO 4217 currency code', example: 'USD' })
  @IsString()
  @IsIn(['USD', 'EUR', 'GBP', 'NGN', 'KES', 'ZAR', 'GHS', 'XAF', 'XOF'])
  currency: string;

  @ApiProperty({ description: 'Unique idempotency key (UUID v4)' })
  @IsUUID('4')
  idempotencyKey: string;

  @ApiPropertyOptional({ description: 'Transfer description/reference' })
  @IsString()
  @IsOptional()
  description?: string;
}
