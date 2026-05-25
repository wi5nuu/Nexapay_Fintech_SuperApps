import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { join } from 'path';
import { Logger } from '@nestjs/common';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  app.enableCors({
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:4200,http://localhost:8100,http://localhost:5173').split(',').map((s: string) => s.trim()),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('NexaPay E-Wallet & Payment Gateway')
    .setDescription('Multi-currency wallet service with SAGA-based P2P transfers, idempotent payments, immutable audit trail')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'wallet',
      protoPath: join(__dirname, 'modules', 'wallet', 'proto', 'wallet.proto'),
      url: `0.0.0.0:${process.env.GRPC_PORT ?? 50051}`,
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
        clientId: 'wallet-service',
      },
      consumer: {
        groupId: 'wallet-consumer-group',
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.HTTP_PORT ?? 3000);

  Logger.log(`Wallet service HTTP listening on port ${process.env.HTTP_PORT ?? 3000}`, 'Bootstrap');
  Logger.log(`Wallet service gRPC listening on port ${process.env.GRPC_PORT ?? 50051}`, 'Bootstrap');
  Logger.log(`Swagger docs at /api/docs`, 'Bootstrap');
}

void bootstrap();
