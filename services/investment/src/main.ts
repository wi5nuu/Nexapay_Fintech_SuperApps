import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { LoggerService } from './common/logger.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(LoggerService);
  app.useLogger(logger);

  app.use(helmet());

  app.enableCors({
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:4200,http://localhost:8100,http://localhost:5173').split(',').map((s: string) => s.trim()),
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('NexaPay Investment Service')
    .setDescription('Mutual Funds, Bonds, Deposits & Portfolio Management API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3002;
  await app.listen(port);

  logger.log(`Investment service running on port ${port}`, 'Bootstrap');
  logger.log(
    `Swagger docs available at http://localhost:${port}/api/docs`,
    'Bootstrap',
  );
}

void bootstrap();
