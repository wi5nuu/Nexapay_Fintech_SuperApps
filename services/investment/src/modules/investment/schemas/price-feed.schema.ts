import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PriceFeedDocument = PriceFeed & Document;

@Schema({ collection: 'price_feeds', timestamps: true })
export class PriceFeed {
  @Prop({ type: Types.ObjectId, auto: true })
  _id!: Types.ObjectId;

  @Prop({ required: true, index: true })
  productId!: string;

  @Prop({ required: true, type: Number })
  price!: number;

  @Prop({ required: true, type: Date, default: Date.now })
  timestamp!: Date;

  @Prop({ type: Number })
  change?: number;

  @Prop({ type: Number })
  changePercent?: number;
}

export const PriceFeedSchema = SchemaFactory.createForClass(PriceFeed);
