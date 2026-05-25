import { Resolver, Query, Args } from '@nestjs/graphql';
import { ReportingService } from './reporting.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { Granularity } from './entities/report.entity';

@Resolver()
export class ReportingResolver {
  constructor(private readonly reportingService: ReportingService) {}

  @Query(() => [[String]], { description: 'Transaction volume report data' })
  async transactionVolume(
    @Args('dateFrom', { nullable: true }) dateFrom?: string,
    @Args('dateTo', { nullable: true }) dateTo?: string,
    @Args('granularity', { type: () => Granularity, nullable: true })
    granularity?: Granularity,
    @Args('module', { nullable: true }) module?: string,
  ): Promise<string[][]> {
    const rows = await this.reportingService.getTransactionVolume(
      dateFrom,
      dateTo,
      granularity ?? Granularity.DAILY,
      module,
    );
    return this.toNestedStringArray(rows as Record<string, unknown>[]);
  }

  @Query(() => [[String]], { description: 'Revenue breakdown by module' })
  async revenueBreakdown(
    @Args('dateFrom', { nullable: true }) dateFrom?: string,
    @Args('dateTo', { nullable: true }) dateTo?: string,
    @Args('granularity', { type: () => Granularity, nullable: true })
    granularity?: Granularity,
  ): Promise<string[][]> {
    const rows = await this.reportingService.getRevenue(
      dateFrom,
      dateTo,
      granularity,
    );
    return this.toNestedStringArray(rows as Record<string, unknown>[]);
  }

  @Query(() => [[String]], { description: 'User growth metrics over time' })
  async userGrowth(
    @Args('dateFrom', { nullable: true }) dateFrom?: string,
    @Args('dateTo', { nullable: true }) dateTo?: string,
    @Args('granularity', { type: () => Granularity, nullable: true })
    granularity?: Granularity,
  ): Promise<string[][]> {
    const rows = await this.reportingService.getUserGrowth(
      dateFrom,
      dateTo,
      granularity ?? Granularity.DAILY,
    );
    return this.toNestedStringArray(rows as Record<string, unknown>[]);
  }

  private toNestedStringArray(rows: Record<string, unknown>[]): string[][] {
    if (rows.length === 0) {
      return [['No data']];
    }
    const headers = Object.keys(rows[0]);
    const result: string[][] = [headers];
    for (const row of rows) {
      result.push(headers.map((h) => String(row[h] ?? '')));
    }
    return result;
  }
}
