import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
}

export class NotificationEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ example: 'Payment Received' })
  title: string;

  @ApiProperty({ example: 'You received $100 from John' })
  body: string;

  @ApiProperty({ isArray: true, enum: NotificationChannel })
  channels: NotificationChannel[];

  @ApiProperty({ enum: NotificationStatus, default: NotificationStatus.PENDING })
  status: NotificationStatus;

  @ApiProperty({ enum: NotificationPriority, default: NotificationPriority.MEDIUM })
  priority: NotificationPriority;

  @ApiProperty({ example: 'wallet.credited' })
  topic: string;

  @ApiPropertyOptional()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional()
  readAt?: Date;

  @ApiPropertyOptional()
  sentAt?: Date;

  @ApiProperty()
  createdAt: Date;

  constructor(partial: Partial<NotificationEntity>) {
    Object.assign(this, partial);
  }
}

export class NotificationPreferenceEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({
    example: { wallet: { in_app: true, email: true, sms: false, push: false } },
  })
  preferences: Record<string, Record<string, boolean>>;

  @ApiProperty({ default: false })
  doNotDisturb: boolean;

  @ApiPropertyOptional()
  quietHoursStart?: string;

  @ApiPropertyOptional()
  quietHoursEnd?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<NotificationPreferenceEntity>) {
    Object.assign(this, partial);
  }
}
