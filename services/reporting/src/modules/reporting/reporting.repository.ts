import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Client } from '@elastic/elasticsearch';
import { ReportEntity, ReportType, Granularity, ReportFormat } from './entities/report.entity';

export interface TransactionVolumeRow {
  period: string;
  volume: number;
  count: number;
}

export interface RevenueRow {
  module: string;
  revenue: number;
  percentage: number;
}

export interface UserGrowthRow {
  period: string;
  newUsers: number;
  totalUsers: number;
}

@Injectable()
export class ReportingRepository implements OnModuleInit {
  private readonly elasticsearchClient: Client;

  constructor(
    @InjectRepository(ReportEntity)
    private readonly reportRepository: Repository<ReportEntity>,
  ) {
    this.elasticsearchClient = new Client({
      node: process.env.ELASTICSEARCH_NODE ?? 'http://localhost:9200',
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.elasticsearchClient.ping();
    } catch {
      // Elasticsearch unavailable — queries will fall back to MySQL only
    }
  }

  async saveReport(data: {
    name: string;
    type: ReportType;
    granularity: Granularity;
    format: ReportFormat;
    data: string;
    filePath?: string;
    parameters?: Record<string, unknown>;
  }): Promise<ReportEntity> {
    const report = this.reportRepository.create({
      ...data,
      generatedAt: new Date(),
    });
    return this.reportRepository.save(report);
  }

  async findReportById(id: string): Promise<ReportEntity | null> {
    return this.reportRepository.findOne({ where: { id } });
  }

  async findReportsByType(
    type: ReportType,
    limit: number = 20,
  ): Promise<ReportEntity[]> {
    return this.reportRepository.find({
      where: { type },
      order: { generatedAt: 'DESC' },
      take: limit,
    });
  }

  async aggregateTransactionVolumeFromES(
    dateFrom?: string,
    dateTo?: string,
    granularity?: Granularity,
    module?: string,
  ): Promise<TransactionVolumeRow[]> {
    const mustFilters: Record<string, unknown>[] = [
      { exists: { field: 'amount' } },
    ];

    if (dateFrom) {
      mustFilters.push({ range: { createdAt: { gte: dateFrom } } });
    }
    if (dateTo) {
      mustFilters.push({ range: { createdAt: { lte: dateTo } } });
    }
    if (module) {
      mustFilters.push({ term: { module } });
    }

    const interval = this.getESInterval(granularity);

    const result = await this.elasticsearchClient.search({
      index: 'transactions',
      size: 0,
      body: {
        query: { bool: { must: mustFilters } },
        aggs: {
          volumes: {
            date_histogram: {
              field: 'createdAt',
              calendar_interval: interval,
              format: 'yyyy-MM-dd',
              min_doc_count: 0,
            },
            aggs: {
              total_volume: { sum: { field: 'amount' } },
            },
          },
        },
      },
    });

    const buckets = (result.aggregations?.volumes as { buckets: Array<{ key_as_string: string; doc_count: number; total_volume: { value: number } }> })?.buckets ?? [];

    return buckets.map((bucket) => ({
      period: bucket.key_as_string,
      volume: bucket.total_volume.value,
      count: bucket.doc_count,
    }));
  }

  async aggregateRevenueFromES(
    dateFrom?: string,
    dateTo?: string,
  ): Promise<RevenueRow[]> {
    const mustFilters: Record<string, unknown>[] = [
      { exists: { field: 'feeAmount' } },
    ];

    if (dateFrom) {
      mustFilters.push({ range: { createdAt: { gte: dateFrom } } });
    }
    if (dateTo) {
      mustFilters.push({ range: { createdAt: { lte: dateTo } } });
    }

    const result = await this.elasticsearchClient.search({
      index: 'transactions',
      size: 0,
      body: {
        query: { bool: { must: mustFilters } },
        aggs: {
          by_module: {
            terms: { field: 'module', size: 50 },
            aggs: {
              total_fees: { sum: { field: 'feeAmount' } },
            },
          },
        },
      },
    });

    const buckets = (result.aggregations?.by_module as { buckets: Array<{ key: string; doc_count: number; total_fees: { value: number } }> })?.buckets ?? [];
    const totalRevenue = buckets.reduce((sum, b) => sum + b.total_fees.value, 0);

    return buckets.map((bucket) => ({
      module: bucket.key,
      revenue: bucket.total_fees.value,
      percentage: totalRevenue > 0 ? (bucket.total_fees.value / totalRevenue) * 100 : 0,
    }));
  }

  async aggregateUserGrowthFromES(
    dateFrom?: string,
    dateTo?: string,
    granularity?: Granularity,
  ): Promise<UserGrowthRow[]> {
    const mustFilters: Record<string, unknown>[] = [];

    if (dateFrom) {
      mustFilters.push({ range: { createdAt: { gte: dateFrom } } });
    }
    if (dateTo) {
      mustFilters.push({ range: { createdAt: { lte: dateTo } } });
    }

    const interval = this.getESInterval(granularity);

    const result = await this.elasticsearchClient.search({
      index: 'users',
      size: 0,
      body: {
        query: { bool: { must: mustFilters } },
        aggs: {
          growth: {
            date_histogram: {
              field: 'createdAt',
              calendar_interval: interval,
              format: 'yyyy-MM-dd',
              min_doc_count: 0,
            },
          },
        },
      },
    });

    const buckets = (result.aggregations?.growth as { buckets: Array<{ key_as_string: string; doc_count: number }> })?.buckets ?? [];

    let cumulative = 0;
    return buckets.map((bucket) => {
      cumulative += bucket.doc_count;
      return {
        period: bucket.key_as_string,
        newUsers: bucket.doc_count,
        totalUsers: cumulative,
      };
    });
  }

  private getESInterval(granularity?: Granularity): string {
    switch (granularity) {
      case Granularity.WEEKLY:
        return 'week';
      case Granularity.MONTHLY:
        return 'month';
      default:
        return 'day';
    }
  }
}
