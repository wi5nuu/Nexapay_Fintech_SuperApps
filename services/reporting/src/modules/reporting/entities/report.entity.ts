import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';

export enum ReportType {
  TRANSACTION_VOLUME = 'TRANSACTION_VOLUME',
  REVENUE = 'REVENUE',
  USER_GROWTH = 'USER_GROWTH',
}

export enum Granularity {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export enum ReportFormat {
  CSV = 'CSV',
  PDF = 'PDF',
}

registerEnumType(ReportType, { name: 'ReportType' });
registerEnumType(Granularity, { name: 'Granularity' });
registerEnumType(ReportFormat, { name: 'ReportFormat' });

@ObjectType()
@Entity('reports')
export class ReportEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ length: 255 })
  name: string;

  @Field(() => ReportType)
  @Column({ type: 'enum', enum: ReportType })
  @Index()
  type: ReportType;

  @Field(() => Granularity)
  @Column({ type: 'enum', enum: Granularity, default: Granularity.DAILY })
  granularity: Granularity;

  @Field(() => ReportFormat)
  @Column({ type: 'enum', enum: ReportFormat, default: ReportFormat.CSV })
  format: ReportFormat;

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  parameters: Record<string, unknown> | null;

  @Field()
  @Column({ type: 'longtext', nullable: true })
  data: string;

  @Field({ nullable: true })
  @Column({ length: 1024, nullable: true })
  filePath: string | null;

  @Field()
  @Column({ type: 'datetime' })
  generatedAt: Date;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  constructor(partial: Partial<ReportEntity>) {
    Object.assign(this, partial);
  }
}
