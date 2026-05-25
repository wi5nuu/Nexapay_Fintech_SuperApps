import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBase64, MinLength } from 'class-validator';

export class SubmitKycDto {
  @ApiProperty({ example: 'PASSPORT' })
  @IsString()
  @MinLength(2)
  idDocType: string;

  @ApiProperty({ description: 'Base64-encoded front image of ID document' })
  @IsString()
  @IsBase64()
  idDocFront: string;

  @ApiPropertyOptional({ description: 'Base64-encoded back image of ID document' })
  @IsString()
  @IsOptional()
  @IsBase64()
  idDocBack?: string;

  @ApiPropertyOptional({ description: 'Base64-encoded liveness video' })
  @IsString()
  @IsOptional()
  @IsBase64()
  livenessVideo?: string;

  @ApiPropertyOptional({ description: 'Base64-encoded selfie image' })
  @IsString()
  @IsOptional()
  @IsBase64()
  selfie?: string;
}
