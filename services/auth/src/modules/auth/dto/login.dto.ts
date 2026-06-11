import { IsEmail, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @ApiProperty({ example: 'StrongP@ss1' })
  @IsString()
  password!: string;

  @ApiPropertyOptional({ example: '123456' })
  @IsOptional()
  @IsString()
  twoFactorCode?: string;
}
