import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED',
}

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  COMPLIANCE = 'COMPLIANCE',
  SUPER_ADMIN = 'SUPER_ADMIN',
  GUEST = 'GUEST',
}

export class UserEntity {
  @ApiProperty({ description: 'Unique user identifier' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @ApiProperty({ enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @ApiPropertyOptional()
  avatarUrl?: string;

  @ApiPropertyOptional()
  phoneNumber?: string;

  @ApiProperty({ default: false })
  isEmailVerified: boolean;

  @ApiProperty({ default: false })
  isPhoneVerified: boolean;

  @ApiPropertyOptional()
  lastLoginAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
