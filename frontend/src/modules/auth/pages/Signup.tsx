import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { useRegister } from '../hooks/useAuthActions'
import { e360 } from '../theme'

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

const inputWrap = (hasError: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 10,
  border: `1px solid ${hasError ? e360.error : e360.outlineVariant}`,
  borderRadius: 12, padding: '13px 14px', background: 'rgba(255,255,255,0.6)',
})

const inputField: React.CSSProperties = {
  flex: 1, border: 'none', outline: 'none', background: 'transparent',
  fontSize: 14, color: e360.primary, fontFamily: 'Geist, sans-serif',
}

const floatingLabel: React.CSSProperties = {
  position: 'absolute', top: -9, left: 12, padding: '0 5px',
  background: '#fff', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
  color: e360.onSurfaceVariant, zIndex: 1,
}

const iconStyle: React.CSSProperties = { color: 'rgba(88,65,63,0.4)', fontSize: 18 }

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
    <AuthLayout title="Institutional Registration" subtitle="Apply for clearance to the EventHub360 ecosystem" icon="badge">
      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {error && (
          <div style={{ background: '#FFDAD6', border: '1px solid rgba(186,26,26,0.25)', color: '#93000A', fontSize: 12, borderRadius: 10, padding: '10px 12px' }}>
            {error}
          </div>
        )}

        <div style={{ position: 'relative' }}>
          <label style={floatingLabel}>Full Name</label>
          <div style={inputWrap(!!errors.fullName)} className="e360-input-wrap">
            <span className="material-symbols-outlined" style={iconStyle}>person</span>
            <input placeholder="Jane Doe" autoComplete="name" style={inputField} {...register('fullName')} />
          </div>
          {errors.fullName && <div style={{ fontSize: 11, color: e360.error, marginTop: 4 }}>{errors.fullName.message}</div>}
        </div>

        <div style={{ position: 'relative' }}>
          <label style={floatingLabel}>Institutional Email</label>
          <div style={inputWrap(!!errors.email)} className="e360-input-wrap">
            <span className="material-symbols-outlined" style={iconStyle}>alternate_email</span>
            <input type="email" placeholder="name@eventhub360.com" autoComplete="email" style={inputField} {...register('email')} />
          </div>
          {errors.email && <div style={{ fontSize: 11, color: e360.error, marginTop: 4 }}>{errors.email.message}</div>}
        </div>

        <div style={{ position: 'relative' }}>
          <label style={floatingLabel}>Phone (Optional)</label>
          <div style={inputWrap(false)} className="e360-input-wrap">
            <span className="material-symbols-outlined" style={iconStyle}>call</span>
            <input placeholder="+91 98765 43210" autoComplete="tel" style={inputField} {...register('phone')} />
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <label style={floatingLabel}>Access Key</label>
          <div style={inputWrap(!!errors.password)} className="e360-input-wrap">
            <span className="material-symbols-outlined" style={iconStyle}>key</span>
            <input type={showPassword ? 'text' : 'password'} placeholder="At least 8 characters" autoComplete="new-password" style={inputField} {...register('password')} />
            <span className="material-symbols-outlined" onClick={() => setShowPassword((s) => !s)} style={{ ...iconStyle, cursor: 'pointer' }}>
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </div>
          {errors.password && <div style={{ fontSize: 11, color: e360.error, marginTop: 4 }}>{errors.password.message}</div>}
        </div>

        <div style={{ position: 'relative' }}>
          <label style={floatingLabel}>Confirm Access Key</label>
          <div style={inputWrap(!!errors.confirmPassword)} className="e360-input-wrap">
            <span className="material-symbols-outlined" style={iconStyle}>key</span>
            <input type={showConfirm ? 'text' : 'password'} placeholder="Re-enter your access key" autoComplete="new-password" style={inputField} {...register('confirmPassword')} />
            <span className="material-symbols-outlined" onClick={() => setShowConfirm((s) => !s)} style={{ ...iconStyle, cursor: 'pointer' }}>
              {showConfirm ? 'visibility_off' : 'visibility'}
            </span>
          </div>
          {errors.confirmPassword && <div style={{ fontSize: 11, color: e360.error, marginTop: 4 }}>{errors.confirmPassword.message}</div>}
        </div>

        <button type="submit" disabled={loading} className="e360-cta" style={{
          width: '100%', height: 52, borderRadius: 14, border: `1px solid rgba(119,90,4,0.2)`,
          color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {loading ? 'Creating Access…' : 'Request Clearance'}
          {!loading && <span className="material-symbols-outlined e360-arrow" style={{ fontSize: 18 }}>arrow_forward</span>}
        </button>

        <p style={{ textAlign: 'center', fontSize: 12, color: e360.onSurfaceVariant, margin: 0 }}>
          Already have access? <Link to="/login" style={{ color: e360.primary, fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
