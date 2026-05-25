import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { InvestmentController } from '../investment.controller';
import { InvestmentService } from '../investment.service';
import { LoggerService } from '../../../common/logger.service';

const mockInvestmentService = {
  getProducts: jest.fn(),
  getProductById: jest.fn(),
  buyInvestment: jest.fn(),
  getPortfolio: jest.fn(),
  getInvestmentById: jest.fn(),
  withdrawInvestment: jest.fn(),
};

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
};

describe('InvestmentController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [InvestmentController],
      providers: [
        { provide: InvestmentService, useValue: mockInvestmentService },
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

  describe('GET /products', () => {
    it('should return product list (200)', async () => {
      const products = [
        {
          id: 'prod-1',
          name: 'Growth Mutual Fund',
          type: 'MUTUAL_FUND',
          description: 'A diversified growth mutual fund',
          minInvestment: 1000,
          maxInvestment: 1000000,
          expectedReturn: 12.5,
          riskLevel: 'MEDIUM',
          status: 'ACTIVE',
        },
        {
          id: 'prod-2',
          name: 'Government Bond',
          type: 'BOND',
          description: 'Low-risk government bond',
          minInvestment: 500,
          maxInvestment: 500000,
          expectedReturn: 5.0,
          riskLevel: 'LOW',
          status: 'ACTIVE',
        },
      ];

      mockInvestmentService.getProducts.mockResolvedValue(products);

      return request(app.getHttpServer())
        .get('/products')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(2);
          expect(res.body[0].name).toBe('Growth Mutual Fund');
          expect(res.body[1].type).toBe('BOND');
        });
    });

    it('should accept optional query filters', async () => {
      mockInvestmentService.getProducts.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get('/products')
        .query({ type: 'BOND', riskLevel: 'LOW' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([]);
          expect(mockInvestmentService.getProducts).toHaveBeenCalledWith({
            type: 'BOND',
            riskLevel: 'LOW',
          });
        });
    });
  });

  describe('GET /products/:id', () => {
    it('should return a single product (200)', async () => {
      const product = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Growth Mutual Fund',
        type: 'MUTUAL_FUND',
        description: 'A diversified growth mutual fund',
        minInvestment: 1000,
        maxInvestment: 1000000,
        expectedReturn: 12.5,
        riskLevel: 'MEDIUM',
        status: 'ACTIVE',
      };

      mockInvestmentService.getProductById.mockResolvedValue(product);

      return request(app.getHttpServer())
        .get('/products/550e8400-e29b-41d4-a716-446655440001')
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe('550e8400-e29b-41d4-a716-446655440001');
          expect(res.body.name).toBe('Growth Mutual Fund');
          expect(res.body.riskLevel).toBe('MEDIUM');
        });
    });

    it('should return 400 for invalid UUID', async () => {
      return request(app.getHttpServer())
        .get('/products/not-a-uuid')
        .expect(400);
    });
  });

  describe('POST /investments/buy', () => {
    it('should create an investment (201)', async () => {
      const buyResult = {
        id: '660e8400-e29b-41d4-a716-446655440002',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        productId: '550e8400-e29b-41d4-a716-446655440001',
        amount: 5000,
        units: 44.44,
        status: 'ACTIVE',
      };

      mockInvestmentService.buyInvestment.mockResolvedValue(buyResult);

      return request(app.getHttpServer())
        .post('/investments/buy')
        .send({
          userId: '550e8400-e29b-41d4-a716-446655440000',
          productId: '550e8400-e29b-41d4-a716-446655440001',
          amount: 5000,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe('ACTIVE');
          expect(res.body.amount).toBe(5000);
          expect(res.body.units).toBe(44.44);
        });
    });

    it('should return 400 when amount is missing', async () => {
      return request(app.getHttpServer())
        .post('/investments/buy')
        .send({
          userId: '550e8400-e29b-41d4-a716-446655440000',
          productId: '550e8400-e29b-41d4-a716-446655440001',
        })
        .expect(400);
    });

    it('should return 400 when userId is not a UUID', async () => {
      return request(app.getHttpServer())
        .post('/investments/buy')
        .send({
          userId: 'not-a-uuid',
          productId: '550e8400-e29b-41d4-a716-446655440001',
          amount: 5000,
        })
        .expect(400);
    });

    it('should return 400 when amount is zero', async () => {
      return request(app.getHttpServer())
        .post('/investments/buy')
        .send({
          userId: '550e8400-e29b-41d4-a716-446655440000',
          productId: '550e8400-e29b-41d4-a716-446655440001',
          amount: 0,
        })
        .expect(400);
    });
  });

  describe('GET /investments/portfolio', () => {
    it('should return user portfolio (200)', async () => {
      const portfolio = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        totalInvested: 10000,
        currentValue: 11250,
        totalReturns: 1250,
        investments: [
          {
            id: 'inv-1',
            productId: 'prod-1',
            productName: 'Growth Mutual Fund',
            amount: 5000,
            units: 44.44,
            status: 'ACTIVE',
            currentValue: 5625,
            returns: 625,
          },
          {
            id: 'inv-2',
            productId: 'prod-2',
            productName: 'Government Bond',
            amount: 5000,
            units: 47.62,
            status: 'ACTIVE',
            currentValue: 5625,
            returns: 625,
          },
        ],
      };

      mockInvestmentService.getPortfolio.mockResolvedValue(portfolio);

      return request(app.getHttpServer())
        .get('/investments/portfolio')
        .query({ userId: '550e8400-e29b-41d4-a716-446655440000' })
        .expect(200)
        .expect((res) => {
          expect(res.body.totalInvested).toBe(10000);
          expect(res.body.investments).toHaveLength(2);
          expect(res.body.totalReturns).toBe(1250);
        });
    });

    it('should return empty portfolio for user with no investments', async () => {
      const emptyPortfolio = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        totalInvested: 0,
        currentValue: 0,
        totalReturns: 0,
        investments: [],
      };

      mockInvestmentService.getPortfolio.mockResolvedValue(emptyPortfolio);

      return request(app.getHttpServer())
        .get('/investments/portfolio')
        .query({ userId: '550e8400-e29b-41d4-a716-446655440000' })
        .expect(200)
        .expect((res) => {
          expect(res.body.investments).toHaveLength(0);
          expect(res.body.totalInvested).toBe(0);
        });
    });
  });

  describe('POST /investments/:id/withdraw', () => {
    it('should withdraw an investment (200)', async () => {
      const withdrawResult = {
        id: '660e8400-e29b-41d4-a716-446655440002',
        status: 'WITHDRAWN',
        returns: 625,
        message: 'Investment withdrawn successfully',
      };

      mockInvestmentService.withdrawInvestment.mockResolvedValue(withdrawResult);

      return request(app.getHttpServer())
        .post('/investments/660e8400-e29b-41d4-a716-446655440002/withdraw')
        .send({
          userId: '550e8400-e29b-41d4-a716-446655440000',
          reason: 'Early liquidation',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('WITHDRAWN');
          expect(res.body.message).toBe('Investment withdrawn successfully');
        });
    });

    it('should return 400 for invalid UUID param', async () => {
      return request(app.getHttpServer())
        .post('/investments/not-a-uuid/withdraw')
        .send({
          userId: '550e8400-e29b-41d4-a716-446655440000',
        })
        .expect(400);
    });

    it('should return 400 when userId is missing', async () => {
      return request(app.getHttpServer())
        .post('/investments/660e8400-e29b-41d4-a716-446655440002/withdraw')
        .send({})
        .expect(400);
    });
  });
});
