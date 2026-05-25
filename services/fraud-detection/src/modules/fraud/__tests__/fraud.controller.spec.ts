import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { FraudController } from '../fraud.controller';
import { FraudService } from '../fraud.service';
import { LoggerService } from '../../../common/logger.service';
import { RuleType, RuleAction } from '../entities/rule.entity';
import { FlagStatus } from '../dto/review-flag.dto';

const mockFraudService = {
  checkTransaction: jest.fn(),
  createRule: jest.fn(),
  getRules: jest.fn(),
  getFlags: jest.fn(),
  reviewFlag: jest.fn(),
  freezeAccount: jest.fn(),
};

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
};

describe('FraudController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [FraudController],
      providers: [
        { provide: FraudService, useValue: mockFraudService },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /fraud/check', () => {
    it('should return check result for a safe transaction (200)', async () => {
      const checkResult = {
        allowed: true,
        hasFlags: false,
        flags: [],
      };

      mockFraudService.checkTransaction.mockResolvedValue(checkResult);

      return request(app.getHttpServer())
        .post('/fraud/check')
        .send({
          userId: 'user-123',
          amount: 5000,
          currency: 'USD',
          ipAddress: '192.168.1.1',
          deviceId: 'device-abc',
          location: 'US-NY',
          transactionType: 'transfer',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.allowed).toBe(true);
          expect(res.body.hasFlags).toBe(false);
          expect(res.body.flags).toEqual([]);
        });
    });

    it('should return alert when transaction is flagged (200)', async () => {
      const flaggedResult = {
        allowed: false,
        hasFlags: true,
        flags: [
          {
            id: 'flag-1',
            ruleId: 'rule-1',
            ruleName: 'High Amount Threshold',
            userId: 'user-123',
            reason: 'High Amount Threshold triggered for user user-123',
            severity: 'high',
            status: 'open',
            metadata: { amount: 50000, currency: 'USD' },
            createdAt: new Date().toISOString(),
          },
        ],
      };

      mockFraudService.checkTransaction.mockResolvedValue(flaggedResult);

      return request(app.getHttpServer())
        .post('/fraud/check')
        .send({
          userId: 'user-123',
          amount: 50000,
          currency: 'USD',
          ipAddress: '192.168.1.1',
          deviceId: 'device-abc',
          location: 'US-NY',
          transactionType: 'transfer',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.allowed).toBe(false);
          expect(res.body.hasFlags).toBe(true);
          expect(res.body.flags).toHaveLength(1);
          expect(res.body.flags[0].ruleName).toBe('High Amount Threshold');
          expect(res.body.flags[0].severity).toBe('high');
        });
    });

    it('should return 400 for missing required fields', async () => {
      return request(app.getHttpServer())
        .post('/fraud/check')
        .send({ userId: 'user-123', amount: 5000 })
        .expect(400);
    });

    it('should return 400 for negative amount', async () => {
      return request(app.getHttpServer())
        .post('/fraud/check')
        .send({
          userId: 'user-123',
          amount: -100,
          currency: 'USD',
          ipAddress: '192.168.1.1',
        })
        .expect(400);
    });
  });

  describe('POST /fraud/rules', () => {
    it('should create a new fraud rule (201)', async () => {
      const newRule = {
        id: 'rule-new-1',
        name: 'Suspicious Country Block',
        type: RuleType.GEO_ANOMALY,
        config: { blockedCountries: ['XX', 'YY'] },
        enabled: true,
        action: RuleAction.BLOCK,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFraudService.createRule.mockResolvedValue(newRule);

      return request(app.getHttpServer())
        .post('/fraud/rules')
        .send({
          name: 'Suspicious Country Block',
          type: RuleType.GEO_ANOMALY,
          config: { blockedCountries: ['XX', 'YY'] },
          enabled: true,
          action: RuleAction.BLOCK,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe('Suspicious Country Block');
          expect(res.body.action).toBe('block');
          expect(res.body.enabled).toBe(true);
        });
    });

    it('should return 400 for invalid rule type', async () => {
      return request(app.getHttpServer())
        .post('/fraud/rules')
        .send({
          name: 'Invalid Rule',
          type: 'unknown_type',
          config: {},
          action: RuleAction.FLAG,
        })
        .expect(400);
    });
  });

  describe('GET /fraud/rules', () => {
    it('should return rules list (200)', async () => {
      const rules = [
        {
          id: 'rule-1',
          name: 'High Amount Threshold',
          type: RuleType.AMOUNT_THRESHOLD,
          config: { maxAmount: 10000 },
          enabled: true,
          action: RuleAction.FLAG,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'rule-2',
          name: 'Per-User Velocity',
          type: RuleType.VELOCITY_PER_USER,
          config: { maxCount: 10, windowMinutes: 5 },
          enabled: true,
          action: RuleAction.FLAG,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockFraudService.getRules.mockResolvedValue(rules);

      return request(app.getHttpServer())
        .get('/fraud/rules')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(2);
          expect(res.body[0].name).toBe('High Amount Threshold');
          expect(res.body[1].type).toBe(RuleType.VELOCITY_PER_USER);
        });
    });

    it('should return empty array when no rules exist', async () => {
      mockFraudService.getRules.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get('/fraud/rules')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });
    });
  });

  describe('GET /fraud/flags', () => {
    it('should return flagged items (200)', async () => {
      const flags = [
        {
          id: 'flag-1',
          ruleId: 'rule-1',
          ruleName: 'High Amount Threshold',
          userId: 'user-123',
          reason: 'High Amount Threshold triggered',
          severity: 'high',
          status: 'open',
          metadata: { amount: 50000 },
          createdAt: new Date(),
        },
        {
          id: 'flag-2',
          ruleId: 'rule-2',
          ruleName: 'Geo Anomaly',
          userId: 'user-456',
          reason: 'Geo Anomaly triggered',
          severity: 'medium',
          status: 'reviewed',
          metadata: { location: 'RU-MOW' },
          createdAt: new Date(),
        },
      ];

      mockFraudService.getFlags.mockResolvedValue(flags);

      return request(app.getHttpServer())
        .get('/fraud/flags')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(2);
          expect(res.body[0].severity).toBe('high');
          expect(res.body[1].status).toBe('reviewed');
        });
    });

    it('should filter flags by status', async () => {
      const openFlags = [
        {
          id: 'flag-1',
          ruleId: 'rule-1',
          ruleName: 'High Amount Threshold',
          userId: 'user-123',
          reason: 'Triggered',
          severity: 'high',
          status: 'open',
          metadata: {},
          createdAt: new Date(),
        },
      ];

      mockFraudService.getFlags.mockResolvedValue(openFlags);

      return request(app.getHttpServer())
        .get('/fraud/flags')
        .query({ status: 'open' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0].status).toBe('open');
          expect(mockFraudService.getFlags).toHaveBeenCalledWith('open');
        });
    });

    it('should return empty array when no flags exist', async () => {
      mockFraudService.getFlags.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get('/fraud/flags')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });
    });
  });

  describe('PATCH /fraud/flags/:id/review', () => {
    it('should update flag status (200)', async () => {
      const reviewedFlag = {
        id: 'flag-1',
        ruleId: 'rule-1',
        ruleName: 'High Amount Threshold',
        userId: 'user-123',
        reason: 'Triggered',
        severity: 'high',
        status: 'dismissed',
        metadata: { reviewedAt: new Date().toISOString() },
        createdAt: new Date(),
      };

      mockFraudService.reviewFlag.mockResolvedValue(reviewedFlag);

      return request(app.getHttpServer())
        .patch('/fraud/flags/flag-1/review')
        .send({
          status: FlagStatus.DISMISSED,
          reason: 'False positive — known customer',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('dismissed');
          expect(res.body.id).toBe('flag-1');
        });
    });

    it('should return 400 for invalid status', async () => {
      return request(app.getHttpServer())
        .patch('/fraud/flags/flag-1/review')
        .send({ status: 'invalid_status' })
        .expect(400);
    });

    it('should return 400 for missing status', async () => {
      return request(app.getHttpServer())
        .patch('/fraud/flags/flag-1/review')
        .send({ reason: 'No status provided' })
        .expect(400);
    });
  });

  describe('POST /fraud/accounts/:id/freeze', () => {
    it('should freeze an account (200)', async () => {
      mockFraudService.freezeAccount.mockResolvedValue(undefined);

      return request(app.getHttpServer())
        .post('/fraud/accounts/user-123/freeze')
        .expect(200)
        .expect((res) => {
          expect(res.body.frozen).toBe(true);
          expect(mockFraudService.freezeAccount).toHaveBeenCalledWith('user-123');
        });
    });

    it('should freeze account even with special characters in id', async () => {
      mockFraudService.freezeAccount.mockResolvedValue(undefined);

      return request(app.getHttpServer())
        .post('/fraud/accounts/account_456-789/freeze')
        .expect(200)
        .expect((res) => {
          expect(res.body.frozen).toBe(true);
          expect(mockFraudService.freezeAccount).toHaveBeenCalledWith('account_456-789');
        });
    });
  });
});
