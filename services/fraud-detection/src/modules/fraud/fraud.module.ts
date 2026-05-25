import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';
import { Kafka } from 'kafkajs';
import { FraudController } from './fraud.controller';
import { FraudService } from './fraud.service';
import { FraudRepository } from './fraud.repository';
import { LoggerService } from '../../common/logger.service';

const redisProvider = {
  provide: 'REDIS_CLIENT',
  useFactory: (): Redis => {
    return new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times: number): number | null => {
        if (times > 10) return null;
        return Math.min(times * 100, 3000);
      },
    });
  },
};

const kafkaProvider = {
  provide: 'KAFKA_CLIENT',
  useFactory: (): Kafka => {
    return new Kafka({
      clientId: 'fraud-detection',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      retry: {
        initialRetryTime: 300,
        retries: 10,
      },
    });
  },
};

@Global()
@Module({
  controllers: [FraudController],
  providers: [
    FraudService,
    FraudRepository,
    LoggerService,
    redisProvider,
    kafkaProvider,
  ],
  exports: [FraudService, FraudRepository, 'REDIS_CLIENT', 'KAFKA_CLIENT'],
})
export class FraudModule {}
