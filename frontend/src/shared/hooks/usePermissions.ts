import type { UserRole } from '../types/auth.types'
import { useAuth } from './useAuth'

const PERMISSIONS: Record<string, UserRole[]> = {
  'invoice.create':  ['super_admin', 'finance_manager', 'accountant'],
  'invoice.view':    ['super_admin', 'finance_manager', 'accountant', 'auditor'],
  'payment.view':    ['super_admin', 'finance_manager', 'accountant'],
  'payment.create':  ['super_admin', 'finance_manager'],
  'pnl.view':        ['super_admin', 'finance_manager', 'auditor'],
  'expense.approve': ['super_admin', 'finance_manager'],
  'expense.submit':  ['super_admin', 'finance_manager', 'accountant'],
  'gst.view':        ['super_admin', 'finance_manager', 'accountant', 'auditor'],
  'audit.view':      ['super_admin', 'finance_manager', 'auditor'],
}

export function usePermissions() {
  const { user } = useAuth()
  const role = user?.role ?? null

  const can = (permission: string): boolean => {
    if (!role) return false
    const allowed = PERMISSIONS[permission]
    if (!allowed) return false
    return allowed.includes(role)
  }

  return { role, can }
}
