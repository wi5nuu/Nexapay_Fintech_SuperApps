import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'kyc_documents' })
export class DocumentModel extends Document {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  idDocFront: string;

  @Prop()
  idDocBack?: string;

  @Prop()
  livenessVideo?: string;

  @Prop()
  selfie?: string;

  @Prop({ default: Date.now })
  uploadedAt: Date;
}

export const DocumentSchema = SchemaFactory.createForClass(DocumentModel);
