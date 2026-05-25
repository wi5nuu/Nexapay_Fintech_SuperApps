import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { WalletController } from '../wallet.controller';
import { WalletService } from '../wallet.service';
import { WalletLogger } from '../../../common/logger.service';

const mockService = {
  createWallet: jest.fn(),
  getBalance: jest.fn(),
  topUp: jest.fn(),
  transfer: jest.fn(),
  getTransactions: jest.fn(),
  getStatement: jest.fn(),
};

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
};

describe('WalletController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [
        { provide: WalletService, useValue: mockService },
        { provide: WalletLogger, useValue: mockLogger },
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

  describe('POST /wallets', () => {
    it('should create a wallet (201)', async () => {
      mockService.createWallet.mockResolvedValue({
        id: 'wallet-id',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        currency: 'USD',
        balance: 0,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return request(app.getHttpServer())
        .post('/wallets')
        .send({ userId: '550e8400-e29b-41d4-a716-446655440000', currency: 'USD' })
        .expect(201)
        .expect((res) => {
          expect(res.body.balance).toEqual(0);
          expect(res.body.userId).toEqual('550e8400-e29b-41d4-a716-446655440000');
        });
    });

    it('should return 400 for invalid userId', async () => {
      return request(app.getHttpServer())
        .post('/wallets')
        .send({ userId: 'not-a-uuid' })
        .expect(400);
    });
  });

  describe('GET /wallets/balance', () => {
    it('should return wallet balance (200)', async () => {
      mockService.getBalance.mockResolvedValue({
        id: 'wallet-id',
        userId: 'user-uuid',
        currency: 'USD',
        balance: 250.0,
        version: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return request(app.getHttpServer())
        .get('/wallets/balance')
        .query({ userId: 'user-uuid', currency: 'USD' })
        .expect(200)
        .expect((res) => {
          expect(res.body.balance).toEqual(250);
        });
    });
  });

  describe('POST /wallets/top-up', () => {
    it('should complete top-up (200)', async () => {
      mockService.topUp.mockResolvedValue({
        id: 'tx-id',
        idempotencyKey: '660e8400-e29b-41d4-a716-446655440001',
        toWalletId: 'wallet-id',
        amount: 100,
        currency: 'USD',
        type: 'TOP_UP',
        status: 'COMPLETED',
        description: 'Top-up',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return request(app.getHttpServer())
        .post('/wallets/top-up')
        .send({
          userId: 'user-uuid',
          amount: 100,
          currency: 'USD',
          idempotencyKey: '660e8400-e29b-41d4-a716-446655440001',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toEqual('COMPLETED');
          expect(res.body.amount).toEqual(100);
        });
    });

    it('should return 400 for missing idempotencyKey', async () => {
      return request(app.getHttpServer())
        .post('/wallets/top-up')
        .send({ userId: 'user-uuid', amount: 100, currency: 'USD' })
        .expect(400);
    });
  });

  describe('POST /wallets/transfer', () => {
    it('should complete transfer (200)', async () => {
      mockService.transfer.mockResolvedValue({
        id: 'tx-id',
        fromWalletId: 'wallet-a',
        toWalletId: 'wallet-b',
        amount: 50,
        currency: 'USD',
        type: 'TRANSFER',
        status: 'COMPLETED',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return request(app.getHttpServer())
        .post('/wallets/transfer')
        .send({
          fromWalletId: 'wallet-a',
          toWalletId: 'wallet-b',
          amount: 50,
          currency: 'USD',
          idempotencyKey: '770e8400-e29b-41d4-a716-446655440002',
        })
        .expect(200);
    });
  });

  describe('GET /wallets/transactions', () => {
    it('should return paginated transactions (200)', async () => {
      mockService.getTransactions.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      return request(app.getHttpServer())
        .get('/wallets/transactions')
        .query({ walletId: 'wallet-id', page: '1', limit: '20' })
        .expect(200)
        .expect((res) => {
          expect(res.body.total).toEqual(0);
          expect(res.body.page).toEqual(1);
        });
    });
  });

  describe('GET /wallets/statement', () => {
    it('should return mini statement (200)', async () => {
      mockService.getStatement.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get('/wallets/statement')
        .query({ walletId: 'wallet-id' })
        .expect(200);
    });
  });
});
