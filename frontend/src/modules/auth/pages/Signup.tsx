import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import AuthLayout from '../components/AuthLayout'
import { useRegister } from '../hooks/useAuthActions'

const signupSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type SignupFormData = z.infer<typeof signupSchema>

const INPUT: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid #E8E0D8', borderRadius: 8,
  fontSize: 13, color: '#334155', outline: 'none', background: '#FAFAF9', boxSizing: 'border-box',
}
const INPUT_ERR: React.CSSProperties = { ...INPUT, border: '1px solid #DC2626' }
const LABEL: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: 6 }
const ERR: React.CSSProperties = { fontSize: 11, color: '#DC2626', marginTop: 4 }

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { register: doRegister, loading, error } = useRegister()
  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    await doRegister(data.fullName, data.email, data.password, data.phone)
  }

  return (
    <AuthLayout title="Create Your Account" subtitle="Set up access to the EventHub360 Finance dashboard">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #F3C9C9', color: '#991B1B', fontSize: 12, borderRadius: 8, padding: '10px 12px', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={LABEL}>Full Name</label>
          <input placeholder="Jane Doe" autoComplete="name" style={errors.fullName ? INPUT_ERR : INPUT} {...register('fullName')} />
          {errors.fullName && <div style={ERR}>{errors.fullName.message}</div>}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={LABEL}>Email Address</label>
          <input type="email" placeholder="name@company.com" autoComplete="email" style={errors.email ? INPUT_ERR : INPUT} {...register('email')} />
          {errors.email && <div style={ERR}>{errors.email.message}</div>}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={LABEL}>Phone (optional)</label>
          <input placeholder="+91 98765 43210" autoComplete="tel" style={INPUT} {...register('phone')} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={LABEL}>Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              style={{ ...(errors.password ? INPUT_ERR : INPUT), paddingRight: 36 }}
              {...register('password')}
            />
            <span onClick={() => setShowPassword((s) => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#94a3b8', fontSize: 14 }}>
              {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            </span>
          </div>
          {errors.password && <div style={ERR}>{errors.password.message}</div>}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={LABEL}>Confirm Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              style={{ ...(errors.confirmPassword ? INPUT_ERR : INPUT), paddingRight: 36 }}
              {...register('confirmPassword')}
            />
            <span onClick={() => setShowConfirm((s) => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#94a3b8', fontSize: 14 }}>
              {showConfirm ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            </span>
          </div>
          {errors.confirmPassword && <div style={ERR}>{errors.confirmPassword.message}</div>}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 8, border: 'none',
            background: '#8B1A1A', color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#8B1A1A', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
        </div>
      </form>
    </AuthLayout>
  )
}
