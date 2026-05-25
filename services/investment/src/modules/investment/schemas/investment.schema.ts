import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InvestmentDocument = Investment & Document;

@Schema({ timestamps: true })
export class Investment {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  productId: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, min: 0 })
  units: number;

  @Prop({ required: true, enum: ['ACTIVE', 'MATURED', 'WITHDRAWN'], default: 'ACTIVE' })
  status: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  maturityDate: Date;

  @Prop({ required: true, default: 0 })
  returns: number;
}

export const InvestmentSchema = SchemaFactory.createForClass(Investment);

InvestmentSchema.index({ userId: 1 });
InvestmentSchema.index({ status: 1 });
