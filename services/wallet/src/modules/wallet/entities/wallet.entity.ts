import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';

export enum TransactionType {
  TOP_UP = 'TOP_UP',
  TRANSFER = 'TRANSFER',
  WITHDRAWAL = 'WITHDRAWAL',
  PAYMENT = 'PAYMENT',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
}

@ObjectType()
export class Wallet {
  @Field()
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @Field()
  @ApiProperty()
  userId: string;

  @Field()
  @ApiProperty({ example: 'USD' })
  currency: string;

  @Field(() => Float)
  @ApiProperty({ example: 100.50 })
  balance: number;

  @Field(() => Int)
  @ApiProperty({ example: 5 })
  version: number;

  @Field()
  @ApiProperty()
  createdAt: Date;

  @Field()
  @ApiProperty()
  updatedAt: Date;
}

@ObjectType()
export class Transaction {
  @Field()
  @ApiProperty()
  id: string;

  @Field()
  @ApiProperty()
  idempotencyKey: string;

  @Field({ nullable: true })
  @ApiProperty({ nullable: true })
  fromWalletId?: string | null;

  @Field({ nullable: true })
  @ApiProperty({ nullable: true })
  toWalletId?: string | null;

  @Field(() => Float)
  @ApiProperty({ example: 50.00 })
  amount: number;

  @Field()
  @ApiProperty({ example: 'USD' })
  currency: string;

  @Field()
  @ApiProperty({ enum: TransactionType })
  type: TransactionType;

  @Field()
  @ApiProperty({ enum: TransactionStatus })
  status: TransactionStatus;

  @Field({ nullable: true })
  @ApiProperty({ nullable: true })
  description?: string | null;

  @Field(() => String, { nullable: true })
  @ApiProperty({ nullable: true })
  metadata?: Record<string, unknown> | null;

  @Field()
  @ApiProperty()
  createdAt: Date;

  @Field()
  @ApiProperty()
  updatedAt: Date;
}
