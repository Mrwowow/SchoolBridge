import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { patchNestJsSwagger } from 'nestjs-zod';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ZodValidationPipe } from './common/pipes/zod-validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // ── Logger ────────────────────────────────────────────────────────────────
  app.useLogger(app.get(Logger));

  // ── Security ──────────────────────────────────────────────────────────────
  app.use(helmet());
  app.enableCors({
    origin: process.env['CORS_ORIGIN'] ?? '*',
    credentials: true,
  });

  // ── Global pipes & filters ────────────────────────────────────────────────
  // Validates every createZodDto() body/query against its Zod schema and
  // passes non-Zod arguments through untouched.
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());

  // ── Swagger ───────────────────────────────────────────────────────────────
  // Teach @nestjs/swagger how to derive OpenAPI schemas from Zod-based DTOs
  // (createZodDto classes), so request bodies & query params render fully.
  patchNestJsSwagger();

  const config = new DocumentBuilder()
    .setTitle('SchoolBridge API')
    .setDescription('Digital parent–teacher communication platform for Nigerian schools')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .addApiKey({ type: 'apiKey', in: 'header', name: 'x-school-id' }, 'school-id')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // ── Start server ──────────────────────────────────────────────────────────
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 4000);

  await app.listen(port);
  const logger = app.get(Logger);
  logger.log(`SchoolBridge API listening on http://localhost:${port}`);
  logger.log(`Swagger docs at http://localhost:${port}/docs`);
}

bootstrap();
