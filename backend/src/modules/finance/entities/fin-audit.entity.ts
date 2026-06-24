import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

export type AuditSeverity = 'info' | 'success' | 'warning' | 'error'

@Entity('fin_audit_trail')
export class FinAuditTrail {
  @PrimaryGeneratedColumn({ name: 'audit_id', type: 'bigint' })
  id: string

  @Column({ name: 'tenant_id', type: 'bigint', default: 1 })
  tenantId: string

  @Column({ name: 'company_id', type: 'bigint', default: 1 })
  companyId: string

  @Column({ name: 'user_id', type: 'varchar', length: 60, nullable: true })
  userId: string

  @Column({ type: 'varchar', length: 60 })
  action: string

  @Column({ type: 'varchar', length: 60, nullable: true })
  entity: string

  @Column({ name: 'entity_id', type: 'varchar', length: 60, nullable: true })
  entityId: string

  @Column({ type: 'text', nullable: true })
  description: string

  @Column({ type: 'varchar', length: 15, default: 'info' })
  severity: AuditSeverity

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  timestamp: Date
}
