import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3012', 10),
  apiPrefix: process.env.API_PREFIX || 'api',
  name: process.env.APP_NAME || 'EventHub360-FIN',
}));

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  poolMin: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
  poolMax: parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'change-me-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-change-me',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'fin:',
}));

export const minioConfig = registerAs('minio', () => ({
  endpoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  buckets: {
    invoices: process.env.MINIO_BUCKET_INVOICES || 'fin-invoices',
    receipts: process.env.MINIO_BUCKET_RECEIPTS || 'fin-receipts',
    bills: process.env.MINIO_BUCKET_BILLS || 'fin-vendor-bills',
    expenses: process.env.MINIO_BUCKET_EXPENSES || 'fin-expenses',
    reports: process.env.MINIO_BUCKET_REPORTS || 'fin-reports',
  },
  publicUrl: process.env.MINIO_PUBLIC_URL || 'http://localhost:9000',
}));

export const companyConfig = registerAs('company', () => ({
  gstin: process.env.COMPANY_GSTIN || '27AABCU9603R1ZX',
  state: process.env.COMPANY_STATE || 'Maharashtra',
  stateCode: process.env.COMPANY_STATE_CODE || '27',
}));

export const financeConfig = registerAs('finance', () => ({
  dunningSendCron: process.env.DUNNING_CRON_SCHEDULE || '0 18 30 * * *',
  gstPrepareCron: process.env.GST_PREPARE_CRON || '0 0 1 * *',
  reconciliationAlertDays: parseInt(
    process.env.RECONCILIATION_ALERT_DAYS || '30',
    10,
  ),
  expenseOcrTolerance: parseFloat(
    process.env.EXPENSE_OCR_TOLERANCE || '0.02',
  ),
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
}));

export const smtpConfig = registerAs('smtp', () => ({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || '',
  from: process.env.EMAIL_FROM || 'EventHub360 Finance <noreply@eventhub360.com>',
}));

export const throttleConfig = registerAs('throttle', () => ({
  ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
  limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
}));

export const swaggerConfig = registerAs('swagger', () => ({
  enabled: process.env.SWAGGER_ENABLED !== 'false',
  title: process.env.SWAGGER_TITLE || 'EventHub 360 — Finance & Accounting API',
  description:
    process.env.SWAGGER_DESCRIPTION || 'Finance Module REST API — v1.0',
  version: process.env.SWAGGER_VERSION || '1.0',
  path: process.env.SWAGGER_PATH || 'api/docs',
}));