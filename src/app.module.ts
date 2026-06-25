import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import {
  appConfig,
  companyConfig,
  databaseConfig,
  financeConfig,
  jwtConfig,
  minioConfig,
  redisConfig,
  smtpConfig,
  swaggerConfig,
  throttleConfig,
} from './config/configuration';

import { PrismaModule } from './shared/prisma/prisma.module';
import { RedisModule } from './shared/redis/redis.module';
import { MinioModule } from './shared/minio/minio.module';
import { AuditModule } from './shared/audit/audit-trail.module';
import { SocketModule } from './shared/socket/socket.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { ResponseInterceptor } from './shared/interceptors/response.interceptor';

import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';

import { FinanceModule } from './modules/finance/finance.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [
        appConfig,
        databaseConfig,
        jwtConfig,
        redisConfig,
        minioConfig,
        companyConfig,
        financeConfig,
        smtpConfig,
        throttleConfig,
        swaggerConfig,
      ],
    }),

    ScheduleModule.forRoot(),

    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('redis.host', 'localhost'),
          port: config.get<number>('redis.port', 6379),
          password: config.get<string>('redis.password') || undefined,
          db: config.get<number>('redis.db', 0),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      }),
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('throttle.ttl', 60) * 1000,
          limit: config.get<number>('throttle.limit', 100),
        },
      ],
    }),

    // Global infrastructure modules
    PrismaModule,
    RedisModule,
    MinioModule,
    AuditModule,
    SocketModule,

    AuthModule,
    FinanceModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
