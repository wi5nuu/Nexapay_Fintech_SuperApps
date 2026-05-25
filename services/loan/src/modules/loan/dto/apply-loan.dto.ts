import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min, MaxLength, IsPositive } from 'class-validator';

export class ApplyLoanDto {
  @ApiProperty({ description: 'Loan amount in base currency', example: 5000 })
  @IsNumber()
  @IsPositive()
  @Min(100)
  amount: number;

  @ApiProperty({ description: 'Purpose of the loan', example: 'Business expansion' })
  @IsString()
  @MaxLength(500)
  purpose: string;

  @ApiProperty({ description: 'Loan term in months', example: 12 })
  @IsNumber()
  @IsPositive()
  @Min(1)
  termMonths: number;
}
