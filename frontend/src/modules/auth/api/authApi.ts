import axiosInstance from '@shared/api/axiosInstance'
import type { ApiResponse } from '../../finance/types/finance.common.types'
import type { AuthUser } from '@shared/types/auth.types'

export interface AuthResult {
  token: string
  user: AuthUser
}

export const authApi = {
  login: (email: string, password: string) =>
    axiosInstance.post<ApiResponse<AuthResult>>('/api/auth/login', { email, password }),

  register: (fullName: string, email: string, password: string, phone?: string) =>
    axiosInstance.post<ApiResponse<AuthResult>>('/api/auth/register', { fullName, email, password, phone }),

  me: () =>
    axiosInstance.get<ApiResponse<AuthUser>>('/api/auth/me'),
}
