import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { LoggerService } from './common/logger.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const logger = app.get(LoggerService);
  app.useLogger(logger);
  app.enableCors({ origin: (process.env.CORS_ORIGIN ?? 'http://localhost:4200,http://localhost:8100').split(',').map((s: string) => s.trim()) });
  app.use(helmet());

  app.setGlobalPrefix('api/v1/notification');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('NexaPay Notification Center')
    .setDescription('In-app, email, SMS, push notification service')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs/notification', app, document);

  const port = parseInt(process.env.PORT ?? '3004', 10);
  await app.listen(port);
  logger.log(`Notification service running on port ${port}`);
}

void bootstrap();
