import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ReportingService } from './reporting.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { Granularity } from './entities/report.entity';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('transaction-volume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get transaction volume report' })
  @ApiResponse({ status: 200, description: 'Transaction volume data' })
  async getTransactionVolume(
    @Query() query: ReportQueryDto,
  ): Promise<{ period: string; volume: number; count: number }[]> {
    return this.reportingService.getTransactionVolume(
      query.dateFrom,
      query.dateTo,
      query.granularity ?? Granularity.DAILY,
      query.module,
    );
  }

  @Get('revenue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get revenue breakdown report' })
  @ApiResponse({ status: 200, description: 'Revenue breakdown by module' })
  async getRevenue(
    @Query() query: ReportQueryDto,
  ): Promise<{ module: string; revenue: number; percentage: number }[]> {
    return this.reportingService.getRevenue(
      query.dateFrom,
      query.dateTo,
      query.granularity ?? Granularity.DAILY,
    );
  }

  @Get('user-growth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user growth metrics' })
  @ApiResponse({ status: 200, description: 'User growth data' })
  async getUserGrowth(
    @Query() query: ReportQueryDto,
  ): Promise<{ period: string; newUsers: number; totalUsers: number }[]> {
    return this.reportingService.getUserGrowth(
      query.dateFrom,
      query.dateTo,
      query.granularity ?? Granularity.DAILY,
    );
  }

  @Get(':id/download')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Download a generated report as CSV or PDF' })
  @ApiResponse({ status: 200, description: 'Report file stream' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async downloadReport(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const report = await this.reportingService.getReportById(id);
    if (!report) {
      throw new NotFoundException(`Report with id ${id} not found`);
    }

    const stream = await this.reportingService.exportReport(report);

    const contentType =
      report.format === 'PDF' ? 'application/pdf' : 'text/csv';
    const extension = report.format === 'PDF' ? 'pdf' : 'csv';
    const filename = `${report.name.replace(/\s+/g, '_')}.${extension}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    stream.pipe(res);
  }
}
