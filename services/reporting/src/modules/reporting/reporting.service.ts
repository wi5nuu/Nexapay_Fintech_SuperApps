import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';
import { Readable } from 'stream';
import { ReportingRepository, TransactionVolumeRow, RevenueRow, UserGrowthRow } from './reporting.repository';
import { LoggerService } from '../../common/logger.service';
import { Granularity, ReportFormat, ReportType } from './entities/report.entity';
import { ReportEntity } from './entities/report.entity';

@Injectable()
export class ReportingService {
  constructor(
    private readonly reportingRepository: ReportingRepository,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('ReportingService');
  }

  async getTransactionVolume(
    dateFrom?: string,
    dateTo?: string,
    granularity: Granularity = Granularity.DAILY,
    module?: string,
  ): Promise<TransactionVolumeRow[]> {
    try {
      return await this.reportingRepository.aggregateTransactionVolumeFromES(
        dateFrom,
        dateTo,
        granularity,
        module,
      );
    } catch (error) {
      this.logger.error('Elasticsearch aggregation failed', error instanceof Error ? error.message : String(error));
      throw new HttpException('Failed to aggregate transaction volume', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getRevenue(
    dateFrom?: string,
    dateTo?: string,
    granularity?: Granularity,
  ): Promise<RevenueRow[]> {
    try {
      return await this.reportingRepository.aggregateRevenueFromES(
        dateFrom,
        dateTo,
      );
    } catch (error) {
      this.logger.error('Elasticsearch revenue aggregation failed', error instanceof Error ? error.message : String(error));
      throw new HttpException('Failed to aggregate revenue', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getUserGrowth(
    dateFrom?: string,
    dateTo?: string,
    granularity: Granularity = Granularity.DAILY,
  ): Promise<UserGrowthRow[]> {
    try {
      return await this.reportingRepository.aggregateUserGrowthFromES(
        dateFrom,
        dateTo,
        granularity,
      );
    } catch (error) {
      this.logger.error('Elasticsearch user growth aggregation failed', error instanceof Error ? error.message : String(error));
      throw new HttpException('Failed to aggregate user growth', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getReportById(id: string): Promise<ReportEntity | null> {
    return this.reportingRepository.findReportById(id);
  }

  async exportReport(report: ReportEntity): Promise<Readable> {
    const parsedData = this.tryParseData(report.data);

    if (report.format === ReportFormat.PDF) {
      return this.generatePdf(report.name, parsedData);
    }
    return this.generateCsv(parsedData);
  }

  async generateAndSaveReport(
    type: ReportType,
    granularity: Granularity,
    format: ReportFormat,
  ): Promise<ReportEntity> {
    let data: unknown[];

    switch (type) {
      case ReportType.TRANSACTION_VOLUME: {
        data = await this.getTransactionVolume(undefined, undefined, granularity);
        break;
      }
      case ReportType.REVENUE: {
        data = await this.getRevenue(undefined, undefined, granularity);
        break;
      }
      case ReportType.USER_GROWTH: {
        data = await this.getUserGrowth(undefined, undefined, granularity);
        break;
      }
      default: {
        data = [];
      }
    }

    const serializedData = JSON.stringify(data);
    const name = `${type}_${granularity}_${new Date().toISOString().split('T')[0]}`;

    return this.reportingRepository.saveReport({
      name,
      type,
      granularity,
      format,
      data: serializedData,
      parameters: { generatedBy: 'cron' },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyReportGeneration(): Promise<void> {
    this.logger.log('Starting daily report generation...');
    await this.generateAndSaveReport(
      ReportType.TRANSACTION_VOLUME,
      Granularity.DAILY,
      ReportFormat.CSV,
    );
    await this.generateAndSaveReport(
      ReportType.REVENUE,
      Granularity.DAILY,
      ReportFormat.CSV,
    );
    await this.generateAndSaveReport(
      ReportType.USER_GROWTH,
      Granularity.DAILY,
      ReportFormat.CSV,
    );
    this.logger.log('Daily report generation completed');
  }

  @Cron(CronExpression.EVERY_WEEK_ON_MONDAY_AT_MIDNIGHT)
  async handleWeeklyReportGeneration(): Promise<void> {
    this.logger.log('Starting weekly report generation...');
    await this.generateAndSaveReport(
      ReportType.TRANSACTION_VOLUME,
      Granularity.WEEKLY,
      ReportFormat.PDF,
    );
    await this.generateAndSaveReport(
      ReportType.REVENUE,
      Granularity.WEEKLY,
      ReportFormat.PDF,
    );
    await this.generateAndSaveReport(
      ReportType.USER_GROWTH,
      Granularity.WEEKLY,
      ReportFormat.PDF,
    );
    this.logger.log('Weekly report generation completed');
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleMonthlyReportGeneration(): Promise<void> {
    this.logger.log('Starting monthly report generation...');
    await this.generateAndSaveReport(
      ReportType.TRANSACTION_VOLUME,
      Granularity.MONTHLY,
      ReportFormat.PDF,
    );
    await this.generateAndSaveReport(
      ReportType.REVENUE,
      Granularity.MONTHLY,
      ReportFormat.PDF,
    );
    await this.generateAndSaveReport(
      ReportType.USER_GROWTH,
      Granularity.MONTHLY,
      ReportFormat.PDF,
    );
    this.logger.log('Monthly report generation completed');
  }

  private generatePdf(title: string, data: unknown[]): Readable {
    const doc = new PDFDocument({ margin: 50 });
    const streamBuffer: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => streamBuffer.push(chunk));

    doc.fontSize(18).text(title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`, { align: 'right' });
    doc.moveDown(2);

    if (Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0] as Record<string, unknown>);
      const tableTop = doc.y;
      const colWidth = Math.min(120, (doc.page.width - 100) / Math.max(headers.length, 1));

      doc.fontSize(9).font('Helvetica-Bold');
      headers.forEach((header, i) => {
        doc.text(header, 50 + i * colWidth, tableTop, { width: colWidth, align: 'left' });
      });
      doc.moveDown(0.5);

      doc.font('Helvetica');
      for (const row of data) {
        const rowData = row as Record<string, unknown>;
        const y = doc.y;
        if (y > doc.page.height - 100) {
          doc.addPage();
        }
        headers.forEach((header, i) => {
          doc.text(String(rowData[header] ?? ''), 50 + i * colWidth, doc.y, {
            width: colWidth,
            align: 'left',
          });
        });
        doc.moveDown(0.3);
      }
    } else {
      doc.text('No data available.');
    }

    doc.end();

    return Readable.from(
      (async function* () {
        for (const chunk of streamBuffer) {
          yield chunk;
        }
      })(),
    );
  }

  private generateCsv(data: unknown[]): Readable {
    if (!Array.isArray(data) || data.length === 0) {
      return Readable.from(['']);
    }

    try {
      const parser = new Parser({ fields: Object.keys(data[0] as Record<string, unknown>) });
      const csv = parser.parse(data);
      return Readable.from([csv]);
    } catch {
      return Readable.from(['']);
    }
  }

  private tryParseData(data: string): unknown[] {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
