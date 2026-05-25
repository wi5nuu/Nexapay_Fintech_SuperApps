import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WithdrawInvestmentDto {
  @ApiProperty({
    description: 'User ID requesting the withdrawal',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  userId!: string;

  @ApiProperty({
    description: 'Reason for withdrawal',
    example: 'Early liquidation',
    required: false,
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
