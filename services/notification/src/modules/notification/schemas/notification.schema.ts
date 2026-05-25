import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'read';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, maxlength: 255 })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop({ type: [String], enum: ['in_app', 'email', 'sms', 'push'], default: ['in_app'] })
  channels: NotificationChannel[];

  @Prop({ type: String, enum: ['pending', 'sent', 'failed', 'read'], default: 'pending' })
  status: NotificationStatus;

  @Prop({ type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' })
  priority: NotificationPriority;

  @Prop()
  topic?: string;

  @Prop({ type: SchemaTypes.Mixed })
  metadata?: Record<string, unknown>;

  @Prop({ type: SchemaTypes.Date })
  sentAt?: Date;

  @Prop({ type: SchemaTypes.Date })
  readAt?: Date;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ topic: 1, status: 1 });
