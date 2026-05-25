import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { ReportingModule } from './modules/reporting/reporting.module';
import { LoggerService } from './common/logger.service';
import { ReportEntity } from './modules/reporting/entities/report.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      url: process.env.REPORTING_MYSQL_URL ?? 'mysql://nexapay:nexapay_pass@localhost:3306/nexapay_reporting',
      entities: [ReportEntity],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: process.env.NODE_ENV !== 'production',
      path: 'api/graphql',
    }),
    ReportingModule,
  ],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class AppModule {}
