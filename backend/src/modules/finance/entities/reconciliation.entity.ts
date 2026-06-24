import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('bank_reconciliation_entries')
export class BankReconciliationEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bank_description', type: 'text' })
  bankDescription: string;

  @Column({ name: 'utr_number', unique: true, length: 50 })
  utrNumber: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ name: 'transaction_date', type: 'date' })
  transactionDate: string;

  @Column({ name: 'matched_invoice_id', type: 'uuid', nullable: true })
  matchedInvoiceId: string | null;

  @Column({ name: 'is_reconciled', type: 'boolean', default: false })
  isReconciled: boolean;

  @Column({ name: 'reconciled_by', type: 'uuid', nullable: true })
  reconciledBy: string | null;

  @Column({ name: 'reconciled_at', type: 'timestamp', nullable: true })
  reconciledAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
