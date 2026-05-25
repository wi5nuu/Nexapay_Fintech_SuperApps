import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PrismaClient, KycStatus, Prisma } from '@prisma/client';
import { DocumentModel } from './entities/kyc.entity';

@Injectable()
export class KycRepository {
  private readonly prisma: PrismaClient;

  constructor(
    @InjectModel(DocumentModel.name)
    private readonly documentModel: Model<DocumentModel>,
  ) {
    this.prisma = new PrismaClient();
  }

  async findById(id: string) {
    return this.prisma.kyc.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.kyc.findUnique({
      where: { userId },
    });
  }

  async upsert(
    userId: string,
    data: {
      idDocType?: string;
      idDocRef?: string;
      idDocBackRef?: string;
      livenessVideoRef?: string;
      selfieRef?: string;
      status: KycStatus;
    },
  ) {
    return this.prisma.kyc.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: data,
    });
  }

  async update(
    id: string,
    data: Prisma.KycUpdateInput,
  ) {
    return this.prisma.kyc.update({
      where: { id },
      data,
    });
  }

  async findByStatus(status: KycStatus) {
    return this.prisma.kyc.findMany({
      where: { status },
      include: { user: true },
      orderBy: { submittedAt: 'asc' },
    });
  }

  async storeDocuments(
    userId: string,
    idDocFront: string,
    idDocBack: string,
    livenessVideo: string,
    selfie: string,
  ) {
    const frontDoc = new this.documentModel({ userId, idDocFront });
    const backDoc = new this.documentModel({ userId, idDocBack });
    const videoDoc = new this.documentModel({ userId, livenessVideo });
    const selfieDoc = new this.documentModel({ userId, selfie });

    const [frontSaved, backSaved, videoSaved, selfieSaved] = await Promise.all([
      frontDoc.save(),
      backDoc.save(),
      videoDoc.save(),
      selfieDoc.save(),
    ]);

    return {
      idDocFrontId: frontSaved._id.toString(),
      idDocBackId: backSaved._id.toString(),
      livenessVideoId: videoSaved._id.toString(),
      selfieId: selfieSaved._id.toString(),
    };
  }

  async getDocuments(documentId: string) {
    return this.documentModel.findById(documentId).exec();
  }
}
