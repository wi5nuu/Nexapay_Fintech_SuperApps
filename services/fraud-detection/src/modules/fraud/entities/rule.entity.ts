import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum RuleType {
  AMOUNT_THRESHOLD = 'amount_threshold',
  VELOCITY_PER_USER = 'velocity_per_user',
  VELOCITY_PER_IP = 'velocity_per_ip',
  NEW_DEVICE = 'new_device',
  GEO_ANOMALY = 'geo_anomaly',
}

export enum RuleAction {
  FLAG = 'flag',
  BLOCK = 'block',
  FREEZE = 'freeze',
}

export class Rule {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'High-amount velocity check' })
  name!: string;

  @ApiProperty({ enum: RuleType, example: RuleType.VELOCITY_PER_USER })
  type!: RuleType;

  @ApiProperty({ example: { maxTransactions: 5, windowMs: 60000 } })
  config!: Record<string, unknown>;

  @ApiProperty({ default: true })
  enabled!: boolean;

  @ApiProperty({ enum: RuleAction, example: RuleAction.FLAG })
  action!: RuleAction;

  @ApiProperty({ example: 1 })
  priority!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}