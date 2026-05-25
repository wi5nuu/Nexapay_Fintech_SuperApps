import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { LoggerService } from './common/logger.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const logger = app.get(LoggerService);

  app.use(helmet());

  app.enableCors({
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:4200,http://localhost:8100,http://localhost:5173').split(',').map((s: string) => s.trim()),
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter(logger));
  app.useGlobalInterceptors(new TransformInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('NexaPay User & KYC API')
    .setDescription('User profile management and KYC verification service')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'nexapay.userkyc',
      protoPath: process.env.GRPC_PROTO_PATH ?? './proto/user-kyc.proto',
      url: process.env.GRPC_URL ?? '0.0.0.0:50051',
    },
  });

  await app.startAllMicroservices();

  const httpPort = process.env.HTTP_PORT ?? 3000;
  await app.listen(httpPort);

  logger.log(
    `User & KYC service running on HTTP port ${httpPort}`,
    'Bootstrap',
  );
}

void bootstrap();
