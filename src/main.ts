import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { validateEnv } from './config/app.config';
import { BODY_LIMITS } from './config/constants';
import type { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const env = validateEnv();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({ origin: env.CORS_ORIGIN, credentials: true });

  app.useBodyParser('json', { limit: BODY_LIMITS.JSON_MAX_BYTES });
  app.useBodyParser('urlencoded', {
    limit: BODY_LIMITS.FORM_MAX_BYTES,
    extended: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(env.PORT);
}

bootstrap();
