import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WalletRepository } from './wallet.repository';
import { WalletResolver } from './wallet.resolver';
import { WalletLogger } from '../../common/logger.service';
import Redis from 'ioredis';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
            clientId: 'wallet-producer',
          },
          producer: {
            allowAutoTopicCreation: true,
          },
        },
      },
    ]),
  ],
  controllers: [WalletController],
  providers: [
    WalletLogger,
    WalletService,
    WalletRepository,
    WalletResolver,
    {
      provide: PrismaClient,
      useFactory: () =>
        new PrismaClient({
          log:
            process.env.NODE_ENV === 'development'
              ? ['query', 'info', 'warn', 'error']
              : ['error'],
        }),
    },
    {
      provide: 'REDIS_CLIENT',
      useFactory: () =>
        new Redis({
          host: process.env.REDIS_HOST ?? 'localhost',
          port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
          keyPrefix: 'wallet:',
        }),
    },
  ],
  exports: [WalletService],
})
export class WalletModule {}
