import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type ReturnType = 'GSTR1' | 'GSTR2A' | 'GSTR3B';
export type FilingStatus = 'filed' | 'pending' | 'late_filed';

@Entity('gst_filings')
export class GstFiling {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 7 })
  period: string;

  @Column({ name: 'return_type', length: 10 })
  returnType: ReturnType;

  @Column({ name: 'gst_output', type: 'decimal', precision: 15, scale: 2 })
  gstOutput: number;

  @Column({ name: 'gst_input', type: 'decimal', precision: 15, scale: 2 })
  gstInput: number;

  @Column({ name: 'itc_available', type: 'decimal', precision: 15, scale: 2 })
  itcAvailable: number;

  @Column({ name: 'itc_utilized', type: 'decimal', precision: 15, scale: 2 })
  itcUtilized: number;

  @Column({ name: 'net_payable', type: 'decimal', precision: 15, scale: 2 })
  netPayable: number;

  @Column({ name: 'filing_status', type: 'varchar', default: 'pending' })
  filingStatus: FilingStatus;

  @Column({ name: 'filed_date', type: 'date', nullable: true })
  filedDate: string | null;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: string;
}
