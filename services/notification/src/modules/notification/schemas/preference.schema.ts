import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type PreferenceDocument = HydratedDocument<Preference>;

export interface ChannelPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
}

export interface TopicPreferences {
  wallet: ChannelPreferences;
  loan: ChannelPreferences;
  kyc: ChannelPreferences;
  fraud: ChannelPreferences;
  investment: ChannelPreferences;
  marketing: ChannelPreferences;
}

const defaultChannelPreferences: ChannelPreferences = {
  email: true,
  sms: false,
  push: true,
  inApp: true,
};

@Schema({ timestamps: true, collection: 'notification_preferences' })
export class Preference {
  @Prop({ type: SchemaTypes.ObjectId, required: true, unique: true, index: true })
  userId: Types.ObjectId;

  @Prop({
    type: SchemaTypes.Mixed,
    default: () => ({
      wallet: { ...defaultChannelPreferences },
      loan: { ...defaultChannelPreferences },
      kyc: { ...defaultChannelPreferences },
      fraud: { ...defaultChannelPreferences, sms: true, email: true },
      investment: { ...defaultChannelPreferences },
      marketing: { email: true, sms: false, push: false, inApp: false },
    }),
  })
  topics: TopicPreferences;

  @Prop({ default: false })
  doNotDisturb: boolean;

  @Prop({ type: SchemaTypes.Mixed })
  quietHours?: { start: string; end: string };
}

export const PreferenceSchema = SchemaFactory.createForClass(Preference);
