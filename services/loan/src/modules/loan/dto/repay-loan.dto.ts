import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, Min } from 'class-validator';

export class RepayLoanDto {
  @ApiProperty({ description: 'Repayment amount', example: 450.0 })
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  amount: number;
}
