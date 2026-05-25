import { Test, TestingModule } from '@nestjs/testing';
import { FraudService, FraudFlag, FraudCheckResponse } from '../fraud.service';
import { FraudRepository } from '../fraud.repository';
import { LoggerService } from '../../../common/logger.service';
import { CheckTransactionDto } from '../dto/check-transaction.dto';
import { CreateRuleDto } from '../dto/create-rule.dto';
import { ReviewFlagDto } from '../dto/review-flag.dto';
import { RuleType, RuleAction, Rule } from '../entities/rule.entity';

describe('FraudService', () => {
  let service: FraudService;
  let repository: jest.Mocked<FraudRepository>;

  const mockKafka = {
    producer: jest.fn().mockReturnValue({
      connect: jest.fn().mockResolvedValue(undefined),
      send: jest.fn().mockResolvedValue(undefined),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FraudService,
        {
          provide: FraudRepository,
          useValue: {
            addToWindow: jest.fn().mockResolvedValue(undefined),
            countInWindow: jest.fn().mockResolvedValue(0),
            isNewDevice: jest.fn().mockResolvedValue(true),
            associateDevice: jest.fn().mockResolvedValue(undefined),
            getLastLocation: jest.fn().mockResolvedValue(null),
            setLastLocation: jest.fn().mockResolvedValue(undefined),
            setFrozen: jest.fn().mockResolvedValue(undefined),
            isFrozen: jest.fn().mockResolvedValue(false),
            scanKeys: jest.fn().mockResolvedValue([]),
            deleteKeys: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: 'KAFKA_CLIENT',
          useValue: mockKafka,
        },
        LoggerService,
      ],
    }).compile();

    service = module.get<FraudService>(FraudService);
    repository = module.get(FraudRepository) as jest.Mocked<FraudRepository>;
    await service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkTransaction', () => {
    it('should allow a clean transaction with no flags', async () => {
      const dto: CheckTransactionDto = {
        userId: 'user-1',
        amount: 50,
        currency: 'USD',
        ipAddress: '192.168.1.1',
        deviceId: 'device-1',
        location: 'US-NY',
        transactionType: 'payment',
      };

      const result: FraudCheckResponse = await service.checkTransaction(dto);

      expect(result.allowed).toBe(true);
      expect(result.hasFlags).toBe(false);
      expect(result.flags).toHaveLength(0);
    });

    it('should flag a high amount transaction', async () => {
      const dto: CheckTransactionDto = {
        userId: 'user-1',
        amount: 99999,
        currency: 'USD',
        ipAddress: '192.168.1.1',
        deviceId: 'device-1',
        location: 'US-NY',
        transactionType: 'payment',
      };

      const result: FraudCheckResponse = await service.checkTransaction(dto);

      expect(result.hasFlags).toBe(true);
      expect(result.flags.length).toBeGreaterThanOrEqual(1);
      expect(result.flags[0].ruleName).toBe('High Amount Threshold');
    });

    it('should flag new device when device is unknown to user', async () => {
      repository.isNewDevice.mockResolvedValue(true);

      const dto: CheckTransactionDto = {
        userId: 'user-1',
        amount: 100,
        currency: 'USD',
        ipAddress: '192.168.1.1',
        deviceId: 'brand-new-device',
        location: 'US-NY',
        transactionType: 'payment',
      };

      const result: FraudCheckResponse = await service.checkTransaction(dto);

      expect(result.hasFlags).toBe(true);
      expect(repository.associateDevice).toHaveBeenCalledWith('user-1', 'brand-new-device');
    });

    it('should flag geo anomaly when location differs from last known', async () => {
      repository.getLastLocation.mockResolvedValue('US-CA');

      const dto: CheckTransactionDto = {
        userId: 'user-1',
        amount: 100,
        currency: 'USD',
        ipAddress: '192.168.1.1',
        deviceId: 'device-1',
        location: 'US-NY',
        transactionType: 'payment',
      };

      const result: FraudCheckResponse = await service.checkTransaction(dto);

      expect(result.hasFlags).toBe(true);
      const geoFlag = result.flags.find((f) => f.ruleName === 'Geo Anomaly Detection');
      expect(geoFlag).toBeDefined();
    });

    it('should flag velocity per-user when exceeding max count', async () => {
      repository.countInWindow.mockResolvedValue(10);

      const dto: CheckTransactionDto = {
        userId: 'user-1',
        amount: 100,
        currency: 'USD',
        ipAddress: '192.168.1.1',
        deviceId: 'device-1',
        location: 'US-NY',
        transactionType: 'payment',
      };

      const result: FraudCheckResponse = await service.checkTransaction(dto);

      expect(result.hasFlags).toBe(true);
      const veloFlag = result.flags.find((f) => f.ruleName === 'Per-User Velocity');
      expect(veloFlag).toBeDefined();
    });

    it('should flag and freeze when freeze threshold is breached', async () => {
      repository.isNewDevice.mockResolvedValue(true);
      repository.countInWindow.mockResolvedValue(15);
      repository.getLastLocation.mockResolvedValue('US-CA');

      const dto: CheckTransactionDto = {
        userId: 'user-2',
        amount: 99999,
        currency: 'USD',
        ipAddress: '10.0.0.1',
        deviceId: 'new-device-123',
        location: 'US-NY',
        transactionType: 'payment',
      };

      const result: FraudCheckResponse = await service.checkTransaction(dto);

      expect(result.allowed).toBe(false);
      expect(result.flags.length).toBeGreaterThanOrEqual(3);
      expect(repository.setFrozen).toHaveBeenCalledWith('user-2', true);
    });

    it('should not flag known device', async () => {
      repository.isNewDevice.mockResolvedValue(false);

      const dto: CheckTransactionDto = {
        userId: 'user-1',
        amount: 100,
        currency: 'USD',
        ipAddress: '192.168.1.1',
        deviceId: 'known-device',
        location: 'US-NY',
        transactionType: 'payment',
      };

      const result: FraudCheckResponse = await service.checkTransaction(dto);

      const deviceFlag = result.flags.find((f) => f.ruleName === 'New Device Detection');
      expect(deviceFlag).toBeUndefined();
    });
  });

  describe('rule management', () => {
    it('should create a new rule', async () => {
      const dto: CreateRuleDto = {
        name: 'Custom Amount Limit',
        type: RuleType.AMOUNT_THRESHOLD,
        config: { maxAmount: 5000 },
        enabled: true,
        action: RuleAction.BLOCK,
      };

      const rule: Rule = await service.createRule(dto);

      expect(rule.id).toBeDefined();
      expect(rule.name).toBe('Custom Amount Limit');
      expect(rule.type).toBe(RuleType.AMOUNT_THRESHOLD);
      expect(rule.action).toBe(RuleAction.BLOCK);
      expect(rule.config).toEqual({ maxAmount: 5000 });
    });

    it('should list all rules including defaults', async () => {
      const rules: Rule[] = await service.getRules();
      expect(rules.length).toBeGreaterThanOrEqual(5);
    });

    it('should create a rule with default enabled state', async () => {
      const dto: CreateRuleDto = {
        name: 'Test Rule No Enabled',
        type: RuleType.GEO_ANOMALY,
        config: {},
        action: RuleAction.FLAG,
      };

      const rule: Rule = await service.createRule(dto);
      expect(rule.enabled).toBe(true);
    });
  });

  describe('flag management', () => {
    it('should review a flag and change status to reviewed', async () => {
      const dto: CheckTransactionDto = {
        userId: 'user-1',
        amount: 99999,
        currency: 'USD',
        ipAddress: '192.168.1.1',
        deviceId: 'device-1',
        location: 'US-NY',
        transactionType: 'payment',
      };

      const checkResult: FraudCheckResponse = await service.checkTransaction(dto);
      const flagId: string = checkResult.flags[0].id;

      const reviewDto: ReviewFlagDto = { status: 'reviewed' };
      const reviewed: FraudFlag = await service.reviewFlag(flagId, reviewDto);

      expect(reviewed.status).toBe('reviewed');
    });

    it('should review a flag and change status to dismissed', async () => {
      const dto: CheckTransactionDto = {
        userId: 'user-1',
        amount: 99999,
        currency: 'USD',
        ipAddress: '192.168.1.1',
        deviceId: 'device-1',
        location: 'US-NY',
        transactionType: 'payment',
      };

      const checkResult: FraudCheckResponse = await service.checkTransaction(dto);
      const flagId: string = checkResult.flags[0].id;

      const reviewDto: ReviewFlagDto = { status: 'dismissed' };
      const reviewed: FraudFlag = await service.reviewFlag(flagId, reviewDto);

      expect(reviewed.status).toBe('dismissed');
    });

    it('should throw NotFoundException for non-existent flag', async () => {
      const reviewDto: ReviewFlagDto = { status: 'dismissed' };
      await expect(service.reviewFlag('non-existent-id', reviewDto)).rejects.toThrow();
    });

    it('should filter flags by status', async () => {
      const dto: CheckTransactionDto = {
        userId: 'user-1',
        amount: 99999,
        currency: 'USD',
        ipAddress: '192.168.1.1',
        deviceId: 'device-1',
        location: 'US-NY',
        transactionType: 'payment',
      };

      await service.checkTransaction(dto);
      const openFlags: FraudFlag[] = await service.getFlags('open');

      expect(openFlags.length).toBeGreaterThan(0);
      openFlags.forEach((f) => expect(f.status).toBe('open'));
    });

    it('should return all flags when no status filter', async () => {
      const dto: CheckTransactionDto = {
        userId: 'user-1',
        amount: 99999,
        currency: 'USD',
        ipAddress: '192.168.1.1',
        deviceId: 'device-1',
        location: 'US-NY',
        transactionType: 'payment',
      };

      await service.checkTransaction(dto);
      const allFlags: FraudFlag[] = await service.getFlags();

      expect(allFlags.length).toBeGreaterThan(0);
    });
  });

  describe('freeze operations', () => {
    it('should freeze an account', async () => {
      await service.freezeAccount('account-123');
      expect(repository.setFrozen).toHaveBeenCalledWith('account-123', true);
    });

    it('should check if an account is frozen', async () => {
      repository.isFrozen.mockResolvedValue(true);
      const frozen: boolean = await service.isFrozen('account-123');
      expect(frozen).toBe(true);
    });

    it('should return false for non-frozen account', async () => {
      repository.isFrozen.mockResolvedValue(false);
      const frozen: boolean = await service.isFrozen('account-456');
      expect(frozen).toBe(false);
    });
  });

  describe('cron cleanup', () => {
    it('should clean expired velocity keys', async () => {
      repository.scanKeys.mockResolvedValue(['fraud:velocity:user:1', 'fraud:velocity:ip:1']);
      await service.cleanExpiredData();
      expect(repository.scanKeys).toHaveBeenCalledWith('fraud:velocity:*');
      expect(repository.deleteKeys).toHaveBeenCalledWith([
        'fraud:velocity:user:1',
        'fraud:velocity:ip:1',
      ]);
    });

    it('should skip delete when no keys found', async () => {
      repository.scanKeys.mockResolvedValue([]);
      await service.cleanExpiredData();
      expect(repository.scanKeys).toHaveBeenCalledWith('fraud:velocity:*');
      expect(repository.deleteKeys).not.toHaveBeenCalled();
    });
  });

  describe('Kafka integration', () => {
    it('should connect producer on init', async () => {
      expect(mockKafka.producer).toHaveBeenCalled();
      expect(mockKafka.producer().connect).toHaveBeenCalled();
    });
  });
});
