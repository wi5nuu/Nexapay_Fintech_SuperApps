import { Test, TestingModule } from '@nestjs/testing';
import { KycStatus } from '@prisma/client';
import { KycService } from '../kyc.service';
import { KycRepository } from '../kyc.repository';
import { LoggerService } from '../../../common/logger.service';

describe('KycService', () => {
  let service: KycService;
  let repository: jest.Mocked<KycRepository>;

  const mockKyc = {
    id: 'kyc-1',
    userId: 'user-1',
    status: KycStatus.PENDING,
    idDocType: 'PASSPORT',
    idDocRef: 'doc-1',
    idDocBackRef: null,
    livenessVideoRef: null,
    selfieRef: null,
    rejectionReason: null,
    reviewedBy: null,
    reviewedAt: null,
    submittedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KycService,
        {
          provide: KycRepository,
          useValue: {
            findById: jest.fn(),
            findByUserId: jest.fn(),
            upsert: jest.fn(),
            update: jest.fn(),
            findByStatus: jest.fn(),
            storeDocuments: jest.fn(),
            getDocuments: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            verbose: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<KycService>(KycService);
    repository = module.get(KycRepository);
  });

  describe('submitKyc', () => {
    it('should create a new KYC submission', async () => {
      repository.findByUserId.mockResolvedValue(null);
      repository.storeDocuments.mockResolvedValue({
        idDocFrontId: 'mongo-1',
        idDocBackId: 'mongo-1',
        livenessVideoId: 'mongo-1',
        selfieId: 'mongo-1',
      });
      repository.upsert.mockResolvedValue(mockKyc);

      const result = await service.submitKyc('user-1', {
        idDocType: 'PASSPORT',
        idDocFront: 'base64data',
      });

      expect(result.status).toBe(KycStatus.PENDING);
      expect(repository.upsert).toHaveBeenCalled();
    });

    it('should throw ConflictException if KYC already verified', async () => {
      repository.findByUserId.mockResolvedValue({
        ...mockKyc,
        status: KycStatus.VERIFIED,
      });

      await expect(
        service.submitKyc('user-1', {
          idDocType: 'PASSPORT',
          idDocFront: 'base64data',
        }),
      ).rejects.toThrow('KYC already verified');
    });
  });

  describe('reviewKyc', () => {
    it('should approve KYC', async () => {
      repository.findById.mockResolvedValue(mockKyc);
      repository.update.mockResolvedValue({
        ...mockKyc,
        status: KycStatus.VERIFIED,
        reviewedBy: 'admin-1',
        reviewedAt: new Date(),
      });

      const result = await service.reviewKyc('kyc-1', { approved: true }, 'admin-1');

      expect(result.status).toBe(KycStatus.VERIFIED);
    });

    it('should reject KYC', async () => {
      repository.findById.mockResolvedValue(mockKyc);
      repository.update.mockResolvedValue({
        ...mockKyc,
        status: KycStatus.REJECTED,
        reviewedBy: 'admin-1',
        rejectionReason: 'Invalid document',
      });

      const result = await service.reviewKyc(
        'kyc-1',
        { approved: false, rejectionReason: 'Invalid document' },
        'admin-1',
      );

      expect(result.status).toBe(KycStatus.REJECTED);
      expect(result.rejectionReason).toBe('Invalid document');
    });

    it('should throw if KYC already verified', async () => {
      repository.findById.mockResolvedValue({
        ...mockKyc,
        status: KycStatus.VERIFIED,
      });

      await expect(
        service.reviewKyc('kyc-1', { approved: true }, 'admin-1'),
      ).rejects.toThrow('KYC already verified');
    });
  });

  describe('getPendingKycs', () => {
    it('should return pending KYC records', async () => {
      repository.findByStatus.mockResolvedValue([mockKyc]);

      const result = await service.getPendingKycs();

      expect(result).toHaveLength(1);
      expect(repository.findByStatus).toHaveBeenCalledWith(KycStatus.PENDING);
    });
  });
});
