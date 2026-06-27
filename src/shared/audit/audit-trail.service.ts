import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction, AuditSeverity } from '../../common/enums';
import { AuditContext } from '../../common/interfaces';

@Injectable()
export class AuditTrailService {
  private readonly logger = new Logger(AuditTrailService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    action: AuditAction | string;
    entity: string;
    entityId: string;
    description: string;
    severity?: AuditSeverity;
    context?: AuditContext;
  }): Promise<void> {
    try {
      await this.prisma.finAuditTrail.create({
        data: {
          userId: params.context?.userId || null,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          description: params.description,
          severity: params.severity || AuditSeverity.INFO,
          ipAddress: params.context?.ipAddress || null,
          metadata: params.context?.metadata
            ? (params.context.metadata as object)
            : undefined,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to write audit trail: ${(error as Error).message}`,
        { action: params.action, entity: params.entity, entityId: params.entityId },
      );
    }
  }

  async logInfo(
    action: AuditAction | string,
    entity: string,
    entityId: string,
    description: string,
    context?: AuditContext,
  ): Promise<void> {
    await this.log({ action, entity, entityId, description, severity: AuditSeverity.INFO, context });
  }

  async logSuccess(
    action: AuditAction | string,
    entity: string,
    entityId: string,
    description: string,
    context?: AuditContext,
  ): Promise<void> {
    await this.log({ action, entity, entityId, description, severity: AuditSeverity.SUCCESS, context });
  }

  async logWarning(
    action: AuditAction | string,
    entity: string,
    entityId: string,
    description: string,
    context?: AuditContext,
  ): Promise<void> {
    await this.log({ action, entity, entityId, description, severity: AuditSeverity.WARNING, context });
  }

  async logError(
    action: AuditAction | string,
    entity: string,
    entityId: string,
    description: string,
    context?: AuditContext,
  ): Promise<void> {
    await this.log({ action, entity, entityId, description, severity: AuditSeverity.ERROR, context });
  }

  async getAuditTrail(params: {
    entity?: string;
    entityId?: string;
    userId?: string;
    severity?: AuditSeverity;
    action?: string;
    fromDate?: Date;
    toDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where = {
      ...(params.entity && { entity: params.entity }),
      ...(params.entityId && { entityId: params.entityId }),
      ...(params.userId && { userId: params.userId }),
      ...(params.severity && { severity: params.severity }),
      ...(params.action && { action: { contains: params.action } }),
      ...(params.fromDate || params.toDate
        ? {
            createdAt: {
              ...(params.fromDate && { gte: params.fromDate }),
              ...(params.toDate && { lte: params.toDate }),
            },
          }
        : {}),
    };

    const [records, total] = await this.prisma.$transaction([
      this.prisma.finAuditTrail.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.finAuditTrail.count({ where }),
    ]);

    return {
      records,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}