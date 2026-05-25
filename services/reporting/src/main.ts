import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { LoggerService } from './common/logger.service';

async function bootstrap(): Promise<void> {
  const logger = new LoggerService('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(logger);

  app.use(helmet());

  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? 'http://localhost:4200,http://localhost:8100,http://localhost:5173').split(',').map((s: string) => s.trim()),
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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('NexaPay Reporting & Analytics Service')
    .setDescription('Transaction volume reports, revenue breakdown, user growth charts, and scheduled report generation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('reports', 'Reporting endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.REPORTING_SERVICE_PORT ?? 4007;
  await app.listen(port, '0.0.0.0');
  logger.log(`Reporting service running on port ${port}`);
}

void bootstrap();
