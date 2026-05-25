import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { LoggerService } from './common/logger.service';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import * as path from 'path';

async function bootstrap(): Promise<void> {
  const logger = new LoggerService('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(logger);

  app.use(helmet());

  const corsWhitelist = process.env.CORS_WHITELIST?.split(',') ?? [];
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || corsWhitelist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(logger));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('NexaPay Auth Service')
    .setDescription('Authentication & Authorization API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const protoPath = path.join(__dirname, 'modules', 'auth', 'proto', 'auth.proto');

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'auth',
      protoPath,
      url: `0.0.0.0:${process.env.GRPC_PORT ?? 50051}`,
    },
  });

  await app.startAllMicroservices();

  const port = process.env.PORT ?? 3001;
  await app.listen(port, process.env.HOST ?? '0.0.0.0');
  logger.log(`Auth service running on port ${port}`);
}

void bootstrap();
