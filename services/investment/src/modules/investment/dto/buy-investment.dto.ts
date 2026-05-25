import {
  IsString,
  IsNumber,
  Min,
  Max,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BuyInvestmentDto {
  @ApiProperty({
    description: 'User ID purchasing the investment',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  userId!: string;

  @ApiProperty({
    description: 'Product ID to invest in',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  productId!: string;

  @ApiProperty({
    description: 'Amount to invest (must be between min and max investment)',
    example: 5000,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @Max(1_000_000_000)
  amount!: number;
}
