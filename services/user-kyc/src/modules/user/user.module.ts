import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { LoggerService } from '../../common/logger.service';
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
            clientId: 'user-kyc-producer',
          },
          producer: {
            allowAutoTopicCreation: true,
          },
        },
      },
    ]),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    LoggerService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: () =>
        new Redis({
          host: process.env.REDIS_HOST ?? 'localhost',
          port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
          keyPrefix: 'user:',
        }),
    },
    {
      provide: 'S3_CLIENT',
      useFactory: () => {
        const { S3Client } = require('@aws-sdk/client-s3');
        return new S3Client({
          region: process.env.AWS_REGION ?? 'us-east-1',
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
          },
        });
      },
    },
  ],
  exports: [UserService, UserRepository, 'REDIS_CLIENT', 'KAFKA_SERVICE'],
})
export class UserModule {}