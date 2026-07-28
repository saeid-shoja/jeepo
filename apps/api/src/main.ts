import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { createCorsOptions, getCorsOrigins } from './common/cors';
import { validationExceptionFactory } from './common/validation';
import { SWAGGER_PATH, setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  // Default 100kb limit rejects listings with base64 images (~260kb+)
  app.useBodyParser('json', { limit: '15mb' });
  app.useBodyParser('urlencoded', { extended: true, limit: '15mb' });

  app.enableCors(createCorsOptions());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );

  app.setGlobalPrefix('api');
  setupSwagger(app);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/api/${SWAGGER_PATH}`);
  console.log(`CORS origins: ${getCorsOrigins().join(', ')}`);
}
bootstrap();
