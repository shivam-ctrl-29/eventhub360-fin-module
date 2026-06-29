import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

export type BillStatus = 'pending' | 'approved' | 'paid' | 'overdue'

@Entity('vendor_bill')
export class VendorBill {
  @PrimaryGeneratedColumn({ name: 'vendor_bill_id', type: 'bigint' })
  id: string

  @Column({ name: 'tenant_id', type: 'bigint', default: 1 })
  tenantId: string

  @Column({ name: 'company_id', type: 'bigint', default: 1 })
  companyId: string

  @Column({ name: 'bill_number', length: 40 })
  billNumber: string

  @Column({ name: 'vendor_name', length: 160 })
  vendorName: string

  @Column({ length: 40, default: 'miscellaneous' })
  category: string

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  amount: number

  @Column({ name: 'gst_amount', type: 'decimal', precision: 14, scale: 2, default: 0 })
  gstAmount: number

  @Column({ name: 'total_amount', type: 'decimal', precision: 14, scale: 2 })
  totalAmount: number

  @Column({ name: 'bill_date', type: 'date', nullable: true })
  billDate: string | null

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: string | null

  @Column({ type: 'varchar', length: 15, default: 'pending' })
  status: BillStatus

  @Column({ name: 'file_name', type: 'text', nullable: true })
  fileName: string | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: string | null

  @Column({ name: 'is_active', default: true })
  isActive: boolean
}
