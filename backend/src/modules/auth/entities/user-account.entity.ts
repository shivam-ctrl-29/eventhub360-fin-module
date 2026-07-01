import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('user_account')
export class UserAccount {
  @PrimaryGeneratedColumn({ name: 'user_id', type: 'bigint' })
  userId: string

  @Column({ name: 'tenant_id', type: 'bigint', nullable: true })
  tenantId: string | null

  @Column({ name: 'company_id', type: 'bigint', nullable: true })
  companyId: string | null

  @Column({ type: 'varchar', length: 160, unique: true })
  email: string

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string

  @Column({ name: 'full_name', type: 'varchar', length: 120, nullable: true })
  fullName: string | null

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null

  @Column({ name: 'mfa_enabled', type: 'boolean', default: false })
  mfaEnabled: boolean

  @Column({ type: 'varchar', length: 15, default: 'active' })
  status: string
}
