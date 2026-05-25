import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { KycStatus } from '@prisma/client';
import { KycRepository } from './kyc.repository';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { ReviewKycDto } from './dto/review-kyc.dto';
import { LoggerService } from '../../common/logger.service';

@Injectable()
export class KycService {
  constructor(
    private readonly kycRepository: KycRepository,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    private readonly logger: LoggerService,
  ) {}

  async submitKyc(userId: string, dto: SubmitKycDto) {
    const existing = await this.kycRepository.findByUserId(userId);

    if (existing && existing.status === KycStatus.VERIFIED) {
      throw new ConflictException('KYC already verified');
    }

    if (existing && existing.status === KycStatus.PENDING) {
      throw new ConflictException('KYC already submitted and pending review');
    }

    const docRecord = await this.kycRepository.storeDocuments(
      userId,
      dto.idDocFront,
      dto.idDocBack,
      dto.livenessVideo,
      dto.selfie,
    );

    const kyc = await this.kycRepository.upsert(userId, {
      idDocType: dto.idDocType,
      idDocRef: docRecord.idDocFrontId,
      idDocBackRef: docRecord.idDocBackId,
      livenessVideoRef: docRecord.livenessVideoId,
      selfieRef: docRecord.selfieId,
      status: KycStatus.PENDING,
    });

    this.logger.log(`KYC submitted for user ${userId}`, 'KycService');

    return kyc;
  }

  async getKycStatus(userId: string) {
    const kyc = await this.kycRepository.findByUserId(userId);

    if (!kyc) {
      return { status: KycStatus.PENDING, kyc: null };
    }

    return { status: kyc.status, kyc };
  }

  async reviewKyc(kycId: string, dto: ReviewKycDto, reviewerId: string) {
    const kyc = await this.kycRepository.findById(kycId);

    if (!kyc) {
      throw new NotFoundException('KYC record not found');
    }

    if (kyc.status !== KycStatus.PENDING) {
      throw new BadRequestException(
        `KYC already ${kyc.status.toLowerCase()}; only pending submissions can be reviewed`,
      );
    }

    const newStatus = dto.approved ? KycStatus.VERIFIED : KycStatus.REJECTED;

    const updated = await this.kycRepository.update(kycId, {
      status: newStatus,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      rejectionReason: dto.rejectionReason ?? null,
    });

    await this.emitKycEvent(updated.userId, newStatus);

    this.logger.log(
      `KYC ${kycId} reviewed by ${reviewerId} → ${newStatus}`,
      'KycService',
    );

    return updated;
  }

  async getPendingKycs() {
    return this.kycRepository.findByStatus(KycStatus.PENDING);
  }

  private async emitKycEvent(userId: string, status: KycStatus): Promise<void> {
    const topic =
      status === KycStatus.VERIFIED ? 'kyc.verified' : 'kyc.rejected';

    this.logger.log(
      `Emitting Kafka event ${topic} for user ${userId}`,
      'KycService',
    );

    try {
      await this.kafkaClient.emit(topic, {
        key: userId,
        value: JSON.stringify({
          event: topic,
          userId,
          status,
          timestamp: new Date().toISOString(),
        }),
      });
      this.logger.log(
        `Kafka event ${topic} emitted for user ${userId}`,
        'KycService',
      );
    } catch (error) {
      this.logger.error(
        `Failed to emit Kafka event ${topic} for user ${userId}`,
        error instanceof Error ? error.message : String(error),
        'KycService',
      );
    }
  }
}
