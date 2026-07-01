import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { EyeOutlined, EyeInvisibleOutlined, GoogleOutlined } from '@ant-design/icons'
import AuthLayout from '../components/AuthLayout'
import { useLogin } from '../hooks/useAuthActions'
import { message } from '@shared/lib/antdStatic'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

const INPUT: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid #E8E0D8', borderRadius: 8,
  fontSize: 13, color: '#334155', outline: 'none', background: '#FAFAF9', boxSizing: 'border-box',
}
const INPUT_ERR: React.CSSProperties = { ...INPUT, border: '1px solid #DC2626' }
const LABEL: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: 6 }
const ERR: React.CSSProperties = { fontSize: 11, color: '#DC2626', marginTop: 4 }

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const { login, loading, error } = useLogin()
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: true },
  })

  const onSubmit = async (data: LoginFormData) => {
    await login(data.email, data.password)
  }

  return (
    <AuthLayout title="Welcome Back" subtitle="Enter your credentials to access your dashboard">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #F3C9C9', color: '#991B1B', fontSize: 12, borderRadius: 8, padding: '10px 12px', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={LABEL}>Email Address</label>
          <input
            type="email"
            placeholder="name@company.com"
            autoComplete="email"
            style={errors.email ? INPUT_ERR : INPUT}
            {...register('email')}
          />
          {errors.email && <div style={ERR}>{errors.email.message}</div>}
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ ...LABEL, marginBottom: 0 }}>Password</label>
            <span
              onClick={() => message.info('Please contact your administrator to reset your password.')}
              style={{ fontSize: 11, fontWeight: 700, color: '#8B1A1A', cursor: 'pointer' }}
            >
              Forgot Password?
            </span>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              style={{ ...(errors.password ? INPUT_ERR : INPUT), paddingRight: 36 }}
              {...register('password')}
            />
            <span
              onClick={() => setShowPassword((s) => !s)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#94a3b8', fontSize: 14 }}
            >
              {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            </span>
          </div>
          {errors.password && <div style={ERR}>{errors.password.message}</div>}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, marginBottom: 20, cursor: 'pointer' }}>
          <input type="checkbox" {...register('remember')} style={{ accentColor: '#8B1A1A', cursor: 'pointer' }} />
          <span style={{ fontSize: 12, color: '#64748b' }}>Remember me for 30 days</span>
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 8, border: 'none',
            background: '#8B1A1A', color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Signing in…' : 'Sign In to EventHub360'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#E8E0D8' }} />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.6px', color: '#94a3b8', textTransform: 'uppercase' }}>Or continue with</span>
          <div style={{ flex: 1, height: 1, background: '#E8E0D8' }} />
        </div>

        <button
          type="button"
          title="Google sign-in is coming soon"
          onClick={() => message.info('Google sign-in is coming soon.')}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 8, border: '1px solid #E8E0D8',
            background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <GoogleOutlined style={{ color: '#DC2626' }} /> Google
        </button>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#64748b' }}>
          Don&apos;t have an account?{' '}
          <Link to="/signup" style={{ color: '#8B1A1A', fontWeight: 700, textDecoration: 'none' }}>Create one</Link>
        </div>
      </form>
    </AuthLayout>
  )
}
