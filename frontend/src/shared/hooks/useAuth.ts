import { useState } from 'react'
import type { AuthUser } from '../types/auth.types'

function parseJwt(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return {
      id: payload.sub ?? payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      avatar: payload.avatar,
    }
  } catch {
    return null
  }
}

export function useAuth() {
  const [user] = useState<AuthUser | null>(() => {
    const token = localStorage.getItem('auth_token')
    return token ? parseJwt(token) : null
  })

  const isAuthenticated = !!user

  function logout() {
    localStorage.removeItem('auth_token')
    window.location.href = '/login'
  }

  return { user, isAuthenticated, logout }
}
