import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class AvatarUploadDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'Avatar image file (JPEG, PNG, max 5MB)' })
  @IsNotEmpty()
  file: Express.Multer.File;
}
