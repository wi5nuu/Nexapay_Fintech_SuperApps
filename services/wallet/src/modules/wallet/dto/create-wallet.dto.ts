import { IsString, IsOptional, IsIn, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWalletDto {
  @ApiProperty({ description: 'User ID owning the wallet' })
  @IsUUID('4')
  userId: string;

  @ApiPropertyOptional({ description: 'ISO 4217 currency code', default: 'USD' })
  @IsString()
  @IsOptional()
  @IsIn(['USD', 'EUR', 'GBP', 'NGN', 'KES', 'ZAR', 'GHS', 'XAF', 'XOF'])
  currency?: string;
}
