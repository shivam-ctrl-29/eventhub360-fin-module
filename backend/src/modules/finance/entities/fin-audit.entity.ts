import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type AuditSeverity = 'info' | 'success' | 'warning' | 'error';

@Entity('fin_audit_trail')
export class FinAuditTrail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ length: 100 })
  action: string;

  @Column({ length: 50 })
  entity: string;

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', default: 'info' })
  severity: AuditSeverity;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;
}
