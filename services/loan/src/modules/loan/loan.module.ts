import { Module, forwardRef } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { LoanController } from './loan.controller';
import { LoanService } from './loan.service';
import { LoanRepository } from './loan.repository';
import { LoanResolver } from './loan.resolver';
import { LoggerService } from '../../common/logger.service';

@Module({
  imports: [
    CacheModule.register({
      ttl: 60_000,
      max: 100,
    }),
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
            clientId: 'loan-producer',
          },
          producer: {
            allowAutoTopicCreation: true,
          },
        },
      },
    ]),
  ],
  controllers: [LoanController],
  providers: [LoanService, LoanRepository, LoanResolver, LoggerService],
  exports: [LoanService],
})
export class LoanModule {}