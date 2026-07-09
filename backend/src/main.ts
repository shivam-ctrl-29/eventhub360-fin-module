import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  // Comma-separated allowlist, e.g. "http://localhost:5174,https://your-app.vercel.app"
  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5174')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: corsOrigins, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`EventHub 360 FIN Backend running on http://localhost:${port}/api`);
}
bootstrap();
