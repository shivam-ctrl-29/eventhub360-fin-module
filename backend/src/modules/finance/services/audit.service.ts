import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { FinAuditTrail } from '../entities/fin-audit.entity'

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(FinAuditTrail)
    private readonly repo: Repository<FinAuditTrail>,
  ) {}

  async log(
    userId: string,
    action: string,
    entity: string,
    entityId: string,
    description: string,
    severity: 'info' | 'success' | 'warning' | 'error' = 'info',
    ipAddress?: string,
    metadata?: Record<string, unknown>,
  ) {
    try {
      const entry = this.repo.create({
        userId, action, entity, entityId, description, severity, ipAddress,
      })
      await this.repo.save(entry)
    } catch {
      // audit failures must never crash the main operation
    }
  }

  async findAll(params: {
    page?: number
    limit?: number
    severity?: string
    action?: string
    search?: string
  }) {
    const { page = 1, limit = 50, severity, action, search } = params
    try {
      const qb = this.repo.createQueryBuilder('a').orderBy('a.timestamp', 'DESC')
      if (severity) qb.andWhere('a.severity = :severity', { severity })
      if (action) qb.andWhere('a.action ILIKE :action', { action: `%${action}%` })
      if (search) {
        qb.andWhere('(a.action ILIKE :s OR a.entity ILIKE :s OR a.description ILIKE :s)', {
          s: `%${search}%`,
        })
      }
      const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount()
      return { data: data.map(this.format), total }
    } catch {
      return { data: [], total: 0 }
    }
  }

  private format(a: FinAuditTrail) {
    return {
      id: a.id,
      timestamp: a.timestamp,
      user: a.userId,
      action: a.action,
      entity: a.entity,
      entityId: a.entityId,
      description: a.description,
      severity: a.severity,
      ipAddress: a.ipAddress,
    }
  }
}
