import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsEnum,
  IsMongoId,
  MaxLength,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationChannel, NotificationPriority } from '../schemas/notification.schema';

export class CreateNotificationDto {
  @ApiProperty({ description: 'Target user ID' })
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Notification title', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Notification body' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ description: 'Delivery channels', enum: ['in_app', 'email', 'sms', 'push'], isArray: true })
  @IsArray()
  @IsEnum(['in_app', 'email', 'sms', 'push'], { each: true })
  @IsOptional()
  channels?: NotificationChannel[];

  @ApiPropertyOptional({ description: 'Notification priority', enum: ['low', 'medium', 'high', 'critical'] })
  @IsEnum(['low', 'medium', 'high', 'critical'])
  @IsOptional()
  priority?: NotificationPriority;

  @ApiPropertyOptional({ description: 'Kafka topic origin' })
  @IsString()
  @IsOptional()
  topic?: string;

  @ApiPropertyOptional({ description: 'Arbitrary metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
