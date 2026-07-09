import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceModule } from './modules/finance/finance.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Hosted Postgres (Neon/Render) provides a single DATABASE_URL and
        // requires TLS; local dev uses discrete DB_* vars without SSL.
        const databaseUrl = config.get<string>('DATABASE_URL');
        const useSsl = config.get('DB_SSL') === 'true' || !!databaseUrl;
        const connection = databaseUrl
          ? { url: databaseUrl }
          : {
              host: config.get('DB_HOST'),
              port: parseInt(config.get('DB_PORT') ?? '5432'),
              username: config.get('DB_USER'),
              password: config.get('DB_PASSWORD'),
              database: config.get('DB_NAME'),
            };
        return {
          type: 'postgres' as const,
          ...connection,
          entities: [__dirname + '/modules/**/*.entity{.ts,.js}'],
          synchronize: false,       // never true in prod — use migrations
          logging: config.get('NODE_ENV') === 'development',
          ssl: useSsl ? { rejectUnauthorized: false } : false,
        };
      },
    }),
    AuthModule,
    FinanceModule,
  ],
})
export class AppModule {}
