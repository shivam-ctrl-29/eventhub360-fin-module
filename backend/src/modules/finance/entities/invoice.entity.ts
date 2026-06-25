import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';

@Entity('invoice')
export class Invoice {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', name: 'invoice_id' })
  invoiceId: string;

  @Column({ name: 'tenant_id', type: 'bigint' })
  tenantId: string;

  @Column({ name: 'company_id', type: 'bigint' })
  companyId: string;

  @Column({ name: 'branch_id', type: 'bigint', nullable: true })
  branchId: string | null;

  @Column({ name: 'booking_id', type: 'bigint', nullable: true })
  bookingId: string | null;

  @Column({ name: 'invoice_no', unique: true, length: 30 })
  invoiceNo: string;

  @Column({ length: 12, default: 'Tax' })
  type: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  subtotal: number;

  @Column({ name: 'tax_total', type: 'decimal', precision: 14, scale: 2, default: 0 })
  taxTotal: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  total: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  balance: number;

  @Column({ length: 12, default: 'Draft' })
  status: string;

  @OneToMany(() => InvoiceLine, (line) => line.invoice, { cascade: true })
  lines: InvoiceLine[];

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

@Entity('invoice_line')
export class InvoiceLine {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', name: 'invoice_line_id' })
  invoiceLineId: string;

  @Column({ name: 'tenant_id', type: 'bigint' })
  tenantId: string;

  @Column({ name: 'company_id', type: 'bigint' })
  companyId: string;

  @Column({ name: 'branch_id', type: 'bigint', nullable: true })
  branchId: string | null;

  @Column({ name: 'invoice_id', type: 'bigint' })
  invoiceId: string;

  @ManyToOne(() => Invoice, (inv) => inv.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @Column({ length: 200 })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1 })
  qty: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  rate: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount: number;

  @Column({ name: 'tax_rule_id', type: 'bigint', nullable: true })
  taxRuleId: string | null;

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
