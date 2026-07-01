import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('payment')
export class Payment {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', name: 'payment_id' })
  paymentId: string;

  @Column({ name: 'tenant_id', type: 'bigint' })
  tenantId: string;

  @Column({ name: 'company_id', type: 'bigint' })
  companyId: string;

  @Column({ name: 'branch_id', type: 'bigint', nullable: true })
  branchId: string | null;

  @Column({ name: 'invoice_id', type: 'bigint' })
  invoiceId: string;

  @Column({ length: 15 })
  mode: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount: number;

  @Column({ name: 'gateway_ref', type: 'varchar', length: 60, nullable: true })
  gatewayRef: string | null;

  @Column({ name: 'paid_at', type: 'timestamptz' })
  paidAt: Date;

  @Column({ name: 'is_reconciled', type: 'boolean', default: false })
  isReconciled: boolean;

  @Column({ name: 'matched_invoice_id', type: 'bigint', nullable: true })
  matchedInvoiceId: string | null;

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
