import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type BillStatus = 'pending' | 'approved' | 'paid' | 'overdue';
export type Priority = 'critical' | 'high' | 'medium' | 'low';

@Entity('vendor_bills')
export class VendorBill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bill_number', length: 50 })
  billNumber: string;

  @Column({ name: 'vendor_id', type: 'uuid' })
  vendorId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ name: 'gst_amount', type: 'decimal', precision: 15, scale: 2 })
  gstAmount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2 })
  totalAmount: number;

  @Column({ name: 'bill_date', type: 'date' })
  billDate: string;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: BillStatus;

  @Column({ type: 'varchar', default: 'medium' })
  priority: Priority;

  @Column({ length: 100 })
  category: string;

  @Column({ name: 'document_url', type: 'text', nullable: true })
  documentUrl: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
