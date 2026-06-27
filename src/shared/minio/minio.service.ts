import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private client: Minio.Client;
  private readonly buckets: Record<string, string>;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.buckets = {
      invoices: this.configService.get('minio.buckets.invoices', 'fin-invoices'),
      receipts: this.configService.get('minio.buckets.receipts', 'fin-receipts'),
      bills: this.configService.get('minio.buckets.bills', 'fin-vendor-bills'),
      expenses: this.configService.get('minio.buckets.expenses', 'fin-expenses'),
      reports: this.configService.get('minio.buckets.reports', 'fin-reports'),
    };
    this.publicUrl = this.configService.get('minio.publicUrl', 'http://localhost:9000');
  }

  async onModuleInit(): Promise<void> {
    this.client = new Minio.Client({
      endPoint: this.configService.get<string>('minio.endpoint', 'localhost'),
      port: this.configService.get<number>('minio.port', 9000),
      useSSL: this.configService.get<boolean>('minio.useSSL', false),
      accessKey: this.configService.get<string>('minio.accessKey', 'minioadmin'),
      secretKey: this.configService.get<string>('minio.secretKey', 'minioadmin'),
    });

    await this.ensureBucketsExist();
    this.logger.log('MinIO connected and buckets verified');
  }

  private async ensureBucketsExist(): Promise<void> {
    for (const [, bucketName] of Object.entries(this.buckets)) {
      const exists = await this.client.bucketExists(bucketName);
      if (!exists) {
        await this.client.makeBucket(bucketName, 'ap-south-1');
        this.logger.log(`Created MinIO bucket: ${bucketName}`);
      }
    }
  }

  async uploadFile(
    bucketKey: string,
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    folder?: string,
  ): Promise<string> {
    const bucket = this.buckets[bucketKey];
    if (!bucket) {
      throw new Error(`Unknown bucket key: ${bucketKey}`);
    }

    const ext = originalName.split('.').pop() || 'bin';
    const uniqueName = `${folder ? folder + '/' : ''}${uuidv4()}.${ext}`;

    await this.client.putObject(bucket, uniqueName, fileBuffer, fileBuffer.length, {
      'Content-Type': mimeType,
      'X-Original-Name': originalName,
    });

    return `${this.publicUrl}/${bucket}/${uniqueName}`;
  }

  async uploadPDFBuffer(
    bucketKey: string,
    buffer: Buffer,
    filename: string,
  ): Promise<string> {
    return this.uploadFile(bucketKey, buffer, filename, 'application/pdf', 'generated');
  }

  async getPresignedUrl(
    bucketKey: string,
    objectPath: string,
    expirySeconds = 3600,
  ): Promise<string> {
    const bucket = this.buckets[bucketKey];
    const objectName = objectPath.replace(`${this.publicUrl}/${bucket}/`, '');
    return this.client.presignedGetObject(bucket, objectName, expirySeconds);
  }

  async deleteFile(bucketKey: string, objectUrl: string): Promise<void> {
    const bucket = this.buckets[bucketKey];
    const objectName = objectUrl.replace(`${this.publicUrl}/${bucket}/`, '');
    await this.client.removeObject(bucket, objectName);
  }

  getClient(): Minio.Client {
    return this.client;
  }
}