import { NestFactory, Reflector } from '@nestjs/core';
import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { ResponseInterceptor } from './shared/interceptors/response.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const port = config.get<number>('app.port', 3012);
  const apiPrefix = config.get<string>('app.apiPrefix', 'api');

  // Security & performance middleware
  app.use(helmet());
  app.use(compression());

  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // The architecture prefixes every route with /api/fin. Controllers declare
  // the `fin/...` segment, so we set the global prefix to `api` only.
  app.setGlobalPrefix(apiPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(
    new ResponseInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  // Swagger / OpenAPI
  if (config.get<boolean>('swagger.enabled', true)) {
    const swaggerPath = config.get<string>('swagger.path', 'api/docs');
    const swaggerDoc = new DocumentBuilder()
      .setTitle(
        config.get<string>(
          'swagger.title',
          'EventHub 360 — Finance & Accounting API',
        ),
      )
      .setDescription(
        config.get<string>(
          'swagger.description',
          'Finance Module REST API — v1.0',
        ),
      )
      .setVersion(config.get<string>('swagger.version', '1.0'))
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerDoc);
    SwaggerModule.setup(swaggerPath, app, document);
    logger.log(`Swagger docs available at /${swaggerPath}`);
  }

  await app.listen(port);
  logger.log(`Finance module running on http://localhost:${port}/${apiPrefix}`);
}

void bootstrap();
