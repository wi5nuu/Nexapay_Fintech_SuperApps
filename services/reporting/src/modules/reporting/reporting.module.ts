import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';
import { ReportingRepository } from './reporting.repository';
import { ReportingResolver } from './reporting.resolver';
import { ReportEntity } from './entities/report.entity';
import { LoggerService } from '../../common/logger.service';

@Module({
  imports: [TypeOrmModule.forFeature([ReportEntity])],
  controllers: [ReportingController],
  providers: [
    ReportingService,
    ReportingRepository,
    ReportingResolver,
    LoggerService,
  ],
  exports: [ReportingService, ReportingRepository],
})
export class ReportingModule {}
