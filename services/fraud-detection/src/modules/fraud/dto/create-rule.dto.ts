import { IsString, IsBoolean, IsObject, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RuleType, RuleAction } from '../entities/rule.entity';

export class CreateRuleDto {
  @ApiProperty({ description: 'Rule name', example: 'High Amount Threshold' })
  @IsString()
  name!: string;

  @ApiProperty({ enum: RuleType, description: 'Rule type' })
  @IsEnum(RuleType)
  type!: RuleType;

  @ApiProperty({
    description: 'Rule configuration (varies by type)',
    example: { maxAmount: 10000 },
  })
  @IsObject()
  config!: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Whether the rule is enabled', default: true })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({ enum: RuleAction, description: 'Action to take when triggered' })
  @IsEnum(RuleAction)
  action!: RuleAction;
}
