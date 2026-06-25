import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('credit_note')
export class CreditNote {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', name: 'credit_note_id' })
  creditNoteId: string;

  @Column({ name: 'tenant_id', type: 'bigint' })
  tenantId: string;

  @Column({ name: 'company_id', type: 'bigint' })
  companyId: string;

  @Column({ name: 'branch_id', type: 'bigint', nullable: true })
  branchId: string | null;

  @Column({ name: 'invoice_id', type: 'bigint' })
  invoiceId: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount: number;

  @Column({ length: 160 })
  reason: string;

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
