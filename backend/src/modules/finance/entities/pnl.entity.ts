import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('pnl')
export class Pnl {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', name: 'pnl_id' })
  pnlId: string;

  @Column({ name: 'tenant_id', type: 'bigint' })
  tenantId: string;

  @Column({ name: 'company_id', type: 'bigint' })
  companyId: string;

  @Column({ name: 'branch_id', type: 'bigint', nullable: true })
  branchId: string | null;

  @Column({ name: 'event_id', type: 'bigint', nullable: true, unique: true })
  eventId: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  revenue: number;

  @Column({ name: 'direct_cost', type: 'decimal', precision: 14, scale: 2, default: 0 })
  directCost: number;

  // margin is GENERATED ALWAYS AS (revenue - direct_cost) STORED — read-only
  @Column({ type: 'decimal', precision: 14, scale: 2, insert: false, update: false, nullable: true })
  margin: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: string | null;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
