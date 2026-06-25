export type UserRole =
  | 'super_admin'
  | 'finance_manager'
  | 'accountant'
  | 'auditor'
  | 'sales_manager'
  | 'event_manager'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
}

export interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
}
