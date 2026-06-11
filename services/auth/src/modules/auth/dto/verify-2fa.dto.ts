import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyTwoFactorDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty({ message: 'Two-factor code is required' })
  @Length(6, 6, { message: 'Two-factor code must be exactly 6 characters' })
  code!: string;
}
