import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { Readable } from 'stream';
import { ReportingController } from '../reporting.controller';
import { ReportingService } from '../reporting.service';
import { LoggerService } from '../../../common/logger.service';

const mockReportingService = {
  getTransactionVolume: jest.fn(),
  getRevenue: jest.fn(),
  getUserGrowth: jest.fn(),
  getReportById: jest.fn(),
  exportReport: jest.fn(),
};

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  setContext: jest.fn(),
};

describe('ReportingController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ReportingController],
      providers: [
        { provide: ReportingService, useValue: mockReportingService },
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

  describe('GET /reports/transaction-volume', () => {
    it('should return transaction volume data (200)', async () => {
      const volumeData = [
        { period: '2026-05-01', volume: 150000, count: 125 },
        { period: '2026-05-02', volume: 180000, count: 142 },
        { period: '2026-05-03', volume: 135000, count: 110 },
      ];

      mockReportingService.getTransactionVolume.mockResolvedValue(volumeData);

      return request(app.getHttpServer())
        .get('/reports/transaction-volume')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(3);
          expect(res.body[0].period).toBe('2026-05-01');
          expect(res.body[0].volume).toBe(150000);
          expect(res.body[1].count).toBe(142);
        });
    });

    it('should accept date range filters', async () => {
      mockReportingService.getTransactionVolume.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get('/reports/transaction-volume')
        .query({
          dateFrom: '2026-05-01T00:00:00Z',
          dateTo: '2026-05-07T23:59:59Z',
          granularity: 'WEEKLY',
          module: 'wallet',
        })
        .expect(200)
        .expect(() => {
          expect(mockReportingService.getTransactionVolume).toHaveBeenCalledWith(
            '2026-05-01T00:00:00Z',
            '2026-05-07T23:59:59Z',
            'WEEKLY',
            'wallet',
          );
        });
    });

    it('should return empty array when no data', async () => {
      mockReportingService.getTransactionVolume.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get('/reports/transaction-volume')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });
    });

    it('should return 400 for invalid date format', async () => {
      return request(app.getHttpServer())
        .get('/reports/transaction-volume')
        .query({ dateFrom: 'not-a-date' })
        .expect(400);
    });
  });

  describe('GET /reports/revenue', () => {
    it('should return revenue breakdown (200)', async () => {
      const revenueData = [
        { module: 'wallet', revenue: 50000, percentage: 50 },
        { module: 'loan', revenue: 30000, percentage: 30 },
        { module: 'investment', revenue: 20000, percentage: 20 },
      ];

      mockReportingService.getRevenue.mockResolvedValue(revenueData);

      return request(app.getHttpServer())
        .get('/reports/revenue')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(3);
          expect(res.body[0].module).toBe('wallet');
          expect(res.body[0].percentage).toBe(50);
          expect(res.body[2].revenue).toBe(20000);
        });
    });

    it('should return 400 for invalid granularity', async () => {
      return request(app.getHttpServer())
        .get('/reports/revenue')
        .query({ granularity: 'YEARLY' })
        .expect(400);
    });
  });

  describe('GET /reports/user-growth', () => {
    it('should return user growth data (200)', async () => {
      const growthData = [
        { period: '2026-05-01', newUsers: 50, totalUsers: 5000 },
        { period: '2026-05-02', newUsers: 35, totalUsers: 5035 },
        { period: '2026-05-03', newUsers: 42, totalUsers: 5077 },
      ];

      mockReportingService.getUserGrowth.mockResolvedValue(growthData);

      return request(app.getHttpServer())
        .get('/reports/user-growth')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(3);
          expect(res.body[0].newUsers).toBe(50);
          expect(res.body[2].totalUsers).toBe(5077);
        });
    });

    it('should respect date filters', async () => {
      mockReportingService.getUserGrowth.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get('/reports/user-growth')
        .query({
          dateFrom: '2026-05-01T00:00:00Z',
          dateTo: '2026-05-31T23:59:59Z',
          granularity: 'MONTHLY',
        })
        .expect(200)
        .expect(() => {
          expect(mockReportingService.getUserGrowth).toHaveBeenCalledWith(
            '2026-05-01T00:00:00Z',
            '2026-05-31T23:59:59Z',
            'MONTHLY',
          );
        });
    });
  });

  describe('GET /reports/:id/download', () => {
    it('should download a CSV report (200)', async () => {
      const report = {
        id: 'report-1',
        name: 'Transaction Volume Report',
        type: 'TRANSACTION_VOLUME',
        format: 'CSV',
        data: JSON.stringify([{ period: '2026-05-01', volume: 150000 }]),
        generatedAt: new Date(),
        createdAt: new Date(),
        granularity: 'DAILY',
        parameters: null,
        filePath: null,
      };

      mockReportingService.getReportById.mockResolvedValue(report);
      mockReportingService.exportReport.mockResolvedValue(
        Readable.from(['period,volume\n2026-05-01,150000\n']),
      );

      return request(app.getHttpServer())
        .get('/reports/report-1/download')
        .expect(200)
        .expect((res) => {
          expect(mockReportingService.getReportById).toHaveBeenCalledWith('report-1');
        });
    });

    it('should download a PDF report (200)', async () => {
      const report = {
        id: 'report-2',
        name: 'Revenue Breakdown',
        type: 'REVENUE',
        format: 'PDF',
        data: JSON.stringify([{ module: 'wallet', revenue: 50000 }]),
        generatedAt: new Date(),
        createdAt: new Date(),
        granularity: 'WEEKLY',
        parameters: null,
        filePath: null,
      };

      mockReportingService.getReportById.mockResolvedValue(report);
      mockReportingService.exportReport.mockResolvedValue(
        Readable.from(['%PDF-1.4 test content']),
      );

      return request(app.getHttpServer())
        .get('/reports/report-2/download')
        .expect(200)
        .expect((res) => {
          expect(mockReportingService.getReportById).toHaveBeenCalledWith('report-2');
        });
    });

    it('should return 404 when report does not exist', async () => {
      mockReportingService.getReportById.mockResolvedValue(null);

      return request(app.getHttpServer())
        .get('/reports/non-existent-id/download')
        .expect(404);
    });
  });
});
