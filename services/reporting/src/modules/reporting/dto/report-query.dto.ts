import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { InputType, Field, registerEnumType } from '@nestjs/graphql';
import { Granularity } from '../entities/report.entity';

@InputType()
export class ReportQueryDto {
  @ApiPropertyOptional({ description: 'Start date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  @Field({ nullable: true })
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  @Field({ nullable: true })
  dateTo?: string;

  @ApiPropertyOptional({ enum: Granularity, default: Granularity.DAILY })
  @IsOptional()
  @IsEnum(Granularity)
  @Field(() => Granularity, { nullable: true })
  granularity?: Granularity;

  @ApiPropertyOptional({ description: 'Module filter (e.g. wallet, loan, investment)' })
  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  module?: string;
}
