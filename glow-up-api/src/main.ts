// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import mongoose from 'mongoose';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
 
import cookieParser from 'cookie-parser';

function extractFirstValidationMessage(
  error: ValidationError,
  visited: Set<ValidationError> = new Set()
): string | undefined {
  if (visited.has(error)) return undefined;
  visited.add(error);

  // Check own constraints first (i18n keys like 'common.errors.SERVICE_NAME_REQUIRED')
  if (error.constraints && Object.keys(error.constraints).length > 0) {
    return Object.values(error.constraints)[0] as string;
  }

  // Recurse into children (nested DTOs/arrays)
  if (error.children && error.children.length > 0) {
    // Depth-first: process children first for deepest errors
    for (const child of error.children) {
      const message = extractFirstValidationMessage(child, visited);
      if (message) return message;
    }
  }

  return undefined;
}


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS
  // app.enableCors({
  //   origin: true,
  //   methods: '*',
  //   allowedHeaders: '*',
  //   credentials: true,
  // });
  app.enableCors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
  credentials: true,
});
   app.use(cookieParser());

  // Mongo logs
  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected');
  });
  mongoose.connection.on('error', (err) => {
    console.error('❌ DB error:', err);
  });

  // Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,

      exceptionFactory: (errors: ValidationError[]) => {
        if (!errors || errors.length === 0) {
          return new BadRequestException('VALIDATION_FAILED');
        }

        const message = errors.map(error => extractFirstValidationMessage(error)).find(msg => msg);
        
        return new BadRequestException(message || 'VALIDATION_FAILED');
      },
    }),
  );

  //  Global filters (WITHOUT I18nValidationFilter)
  // app.useGlobalFilters(
  //   new ValidationExceptionFilter(),
  //   new HttpExceptionFilter(),
  // );


  // Swagger
  const configService = app.get(ConfigService);
  const config = new DocumentBuilder()
    .setTitle('Glow Up API')
    .setDescription('API documentation for Glow Up project')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer' }, 'otp-token')
    .addBearerAuth({ type: 'http', scheme: 'bearer' }, 'access-token')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('app.port') || 3000;
  await app.listen(port);
}
bootstrap();
