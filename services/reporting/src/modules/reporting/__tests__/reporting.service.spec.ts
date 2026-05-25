import { Test, TestingModule } from '@nestjs/testing';
import { ReportingService } from '../reporting.service';
import { ReportingRepository } from '../reporting.repository';
import { LoggerService } from '../../../common/logger.service';
import { Granularity, ReportType, ReportFormat } from '../entities/report.entity';

const mockRepository = {
  aggregateTransactionVolumeFromES: jest.fn(),
  aggregateRevenueFromES: jest.fn(),
  aggregateUserGrowthFromES: jest.fn(),
  saveReport: jest.fn(),
  findReportById: jest.fn(),
  findReportsByType: jest.fn(),
};

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  setContext: jest.fn(),
};

describe('ReportingService', () => {
  let service: ReportingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportingService,
        { provide: ReportingRepository, useValue: mockRepository },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<ReportingService>(ReportingService);
    jest.clearAllMocks();
  });

  describe('getTransactionVolume', () => {
    it('should return aggregated transaction volume data', async () => {
      const mockData = [
        { period: '2024-01-01', volume: 15000, count: 120 },
        { period: '2024-01-02', volume: 22000, count: 185 },
      ];
      mockRepository.aggregateTransactionVolumeFromES.mockResolvedValue(mockData);

      const result = await service.getTransactionVolume(
        '2024-01-01',
        '2024-01-31',
        Granularity.DAILY,
        'wallet',
      );

      expect(result).toEqual(mockData);
      expect(mockRepository.aggregateTransactionVolumeFromES).toHaveBeenCalledWith(
        '2024-01-01',
        '2024-01-31',
        Granularity.DAILY,
        'wallet',
      );
    });

    it('should return empty array when ES fails', async () => {
      mockRepository.aggregateTransactionVolumeFromES.mockRejectedValue(new Error('ES unavailable'));

      const result = await service.getTransactionVolume();

      expect(result).toEqual([]);
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('getRevenue', () => {
    it('should return revenue breakdown by module', async () => {
      const mockData = [
        { module: 'wallet', revenue: 5000, percentage: 50 },
        { module: 'loan', revenue: 3000, percentage: 30 },
        { module: 'investment', revenue: 2000, percentage: 20 },
      ];
      mockRepository.aggregateRevenueFromES.mockResolvedValue(mockData);

      const result = await service.getRevenue('2024-01-01', '2024-01-31');

      expect(result).toHaveLength(3);
      expect(result[0].module).toBe('wallet');
      expect(result[0].revenue).toBe(5000);
    });
  });

  describe('getUserGrowth', () => {
    it('should return user growth metrics', async () => {
      const mockData = [
        { period: '2024-01-01', newUsers: 50, totalUsers: 1000 },
        { period: '2024-01-02', newUsers: 30, totalUsers: 1030 },
      ];
      mockRepository.aggregateUserGrowthFromES.mockResolvedValue(mockData);

      const result = await service.getUserGrowth(
        '2024-01-01',
        '2024-01-31',
        Granularity.DAILY,
      );

      expect(result).toEqual(mockData);
    });
  });

  describe('generateAndSaveReport', () => {
    it('should generate and save a transaction volume report', async () => {
      const mockVolumeData = [
        { period: '2024-01-01', volume: 15000, count: 120 },
      ];
      mockRepository.aggregateTransactionVolumeFromES.mockResolvedValue(mockVolumeData);
      mockRepository.saveReport.mockResolvedValue({
        id: 'report-uuid',
        name: 'TRANSACTION_VOLUME_DAILY_2024-01-01',
        type: ReportType.TRANSACTION_VOLUME,
        granularity: Granularity.DAILY,
        format: ReportFormat.CSV,
        data: JSON.stringify(mockVolumeData),
        generatedAt: new Date(),
        createdAt: new Date(),
      });

      const report = await service.generateAndSaveReport(
        ReportType.TRANSACTION_VOLUME,
        Granularity.DAILY,
        ReportFormat.CSV,
      );

      expect(report).toBeDefined();
      expect(report.type).toBe(ReportType.TRANSACTION_VOLUME);
      expect(mockRepository.saveReport).toHaveBeenCalled();
    });
  });

  describe('getReportById', () => {
    it('should return a report by id', async () => {
      const mockReport = {
        id: 'report-uuid',
        name: 'Test Report',
        type: ReportType.REVENUE,
        granularity: Granularity.WEEKLY,
        format: ReportFormat.PDF,
        data: '[]',
        generatedAt: new Date(),
        createdAt: new Date(),
      };
      mockRepository.findReportById.mockResolvedValue(mockReport);

      const result = await service.getReportById('report-uuid');

      expect(result).toBeDefined();
      expect(result!.id).toBe('report-uuid');
    });

    it('should return null when report not found', async () => {
      mockRepository.findReportById.mockResolvedValue(null);

      const result = await service.getReportById('non-existent');

      expect(result).toBeNull();
    });
  });
});
