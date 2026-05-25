import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class RejectLoanDto {
  @ApiProperty({ description: 'Reason for rejection', example: 'Insufficient credit score' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
