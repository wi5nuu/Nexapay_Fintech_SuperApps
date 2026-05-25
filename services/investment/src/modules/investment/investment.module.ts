import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvestmentController } from './investment.controller';
import { InvestmentService } from './investment.service';
import { InvestmentRepository } from './investment.repository';
import { InvestmentGateway } from './investment.gateway';
import { InvestmentResolver } from './investment.resolver';
import { PriceFeed, PriceFeedSchema } from './schemas/price-feed.schema';
import { Investment, InvestmentSchema } from './schemas/investment.schema';
import { LoggerService } from '../../common/logger.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PriceFeed.name, schema: PriceFeedSchema },
      { name: Investment.name, schema: InvestmentSchema },
    ]),
  ],
  controllers: [InvestmentController],
  providers: [
    InvestmentService,
    InvestmentRepository,
    InvestmentGateway,
    InvestmentResolver,
    LoggerService,
  ],
  exports: [InvestmentService, InvestmentRepository],
})
export class InvestmentModule {}
