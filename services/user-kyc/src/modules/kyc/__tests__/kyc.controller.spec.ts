import { Test, TestingModule } from '@nestjs/testing';
import { KycController } from '../kyc.controller';
import { KycService } from '../kyc.service';
import { SubmitKycDto } from '../dto/submit-kyc.dto';
import { ReviewKycDto } from '../dto/review-kyc.dto';

type ServiceResult<T extends (...args: unknown[]) => unknown> = Awaited<ReturnType<T>>;

describe('KycController', () => {
  let controller: KycController;
  let service: jest.Mocked<KycService>;

  const mockRequest = (userId: string): { userId: string } => ({ userId });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KycController],
      providers: [
        {
          provide: KycService,
          useValue: {
            submitKyc: jest.fn(),
            getKycStatus: jest.fn(),
            reviewKyc: jest.fn(),
            getPendingKycs: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<KycController>(KycController);
    service = module.get(KycService);
  });

  describe('submitKyc', () => {
    it('should call service.submitKyc with userId and dto', async () => {
      const dto: SubmitKycDto = {
        idDocType: 'PASSPORT',
        idDocFront: 'base64data',
      };
      const expected: ServiceResult<typeof service.submitKyc> = { id: 'kyc-1', status: 'PENDING' } as ServiceResult<typeof service.submitKyc>;

      service.submitKyc.mockResolvedValue(expected);

      const result = await controller.submitKyc(mockRequest('user-1'), dto);

      expect(result).toEqual(expected);
      expect(service.submitKyc).toHaveBeenCalledWith('user-1', dto);
    });
  });

  describe('getKycStatus', () => {
    it('should return KYC status for current user', async () => {
      const expected: ServiceResult<typeof service.getKycStatus> = { status: 'VERIFIED', kyc: {} } as ServiceResult<typeof service.getKycStatus>;

      service.getKycStatus.mockResolvedValue(expected);

      const result = await controller.getKycStatus(mockRequest('user-1'));

      expect(result).toEqual(expected);
      expect(service.getKycStatus).toHaveBeenCalledWith('user-1');
    });
  });

  describe('reviewKyc', () => {
    it('should call service.reviewKyc with kycId, dto, and reviewerId', async () => {
      const dto: ReviewKycDto = { approved: true };
      const expected: ServiceResult<typeof service.reviewKyc> = { id: 'kyc-1', status: 'VERIFIED' } as ServiceResult<typeof service.reviewKyc>;

      service.reviewKyc.mockResolvedValue(expected);

      const result = await controller.reviewKyc('kyc-1', dto, mockRequest('admin-1'));

      expect(result).toEqual(expected);
      expect(service.reviewKyc).toHaveBeenCalledWith('kyc-1', dto, 'admin-1');
    });
  });

  describe('getPendingKycs', () => {
    it('should call service.getPendingKycs', async () => {
      const expected: ServiceResult<typeof service.getPendingKycs> = [{ id: 'kyc-1', status: 'PENDING' }] as ServiceResult<typeof service.getPendingKycs>;

      service.getPendingKycs.mockResolvedValue(expected);

      const result = await controller.getPendingKycs();

      expect(result).toEqual(expected);
      expect(service.getPendingKycs).toHaveBeenCalled();
    });
  });
});
