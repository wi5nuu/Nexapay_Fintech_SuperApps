import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { LoggerService } from './common/logger.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: new LoggerService(),
  });

  app.enableCors({
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:4200,http://localhost:8100').split(',').map((s: string) => s.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Idempotency-Key', 'X-Request-Id'],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('NexaPay Fraud Detection Engine')
    .setDescription(
      'Rule-based anomaly detection, velocity checks, suspicious pattern flagging, and auto-freeze on threshold breach',
    )
    .setVersion('1.0')
    .addTag('fraud')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use(helmet());

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      },
      consumer: {
        groupId: 'fraud-detection-consumer',
      },
      subscribe: {
        fromBeginning: false,
      },
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'fraud',
      protoPath: join(__dirname, 'proto', 'fraud.proto'),
      url: `0.0.0.0:${process.env.GRPC_PORT || '50051'}`,
    },
  });

  const httpPort = process.env.HTTP_PORT || 3000;
  await app.startAllMicroservices();
  await app.listen(httpPort);

  const logger = app.get(LoggerService);
  logger.log(`Fraud Detection Engine HTTP server running on port ${httpPort}`);
  logger.log(`gRPC server running on port ${process.env.GRPC_PORT || '50051'}`);
  logger.log('Kafka consumer subscribed to: wallet.transaction.created, loan.repayment.created');
  logger.log('Kafka producer ready for topic: fraud.alert');
}

bootstrap();
