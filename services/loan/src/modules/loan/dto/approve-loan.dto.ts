import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ApproveLoanDto {
  @ApiPropertyOptional({ description: 'Admin notes for approval', example: 'Credit check passed' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
