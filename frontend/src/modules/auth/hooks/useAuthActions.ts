import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/authApi'

function extractErrorMessage(err: any, fallback: string): string {
  const msg = err?.response?.data?.message
  if (Array.isArray(msg)) return msg.join(', ')
  if (typeof msg === 'string' && msg.trim()) return msg
  return fallback
}

export function useLogin() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await authApi.login(email, password)
      localStorage.setItem('auth_token', data.data.token)
      navigate('/finance/dashboard', { replace: true })
      return true
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Invalid email or password'))
      return false
    } finally {
      setLoading(false)
    }
  }

  return { login, loading, error }
}

export function useRegister() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const register = async (fullName: string, email: string, password: string, phone?: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await authApi.register(fullName, email, password, phone)
      localStorage.setItem('auth_token', data.data.token)
      navigate('/finance/dashboard', { replace: true })
      return true
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Could not create account'))
      return false
    } finally {
      setLoading(false)
    }
  }

  return { register, loading, error }
}
