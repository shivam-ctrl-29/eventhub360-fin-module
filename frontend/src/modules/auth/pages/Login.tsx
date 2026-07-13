import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { useLogin } from '../hooks/useAuthActions'
import { message } from '@shared/lib/antdStatic'
import { e360 } from '../theme'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

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

function ProviderIcon({ provider }: { provider: 'google' | 'microsoft' | 'apple' }) {
  if (provider === 'google') {
    return (
      <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.6 15.6 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4c-7.5 0-14 4.2-17.7 10.7z"/><path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 14-5.4l-6.5-5.4c-2 1.5-4.6 2.4-7.5 2.4-5.3 0-9.7-3.4-11.3-8.1l-6.6 5.1C9.9 39.8 16.4 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.5 5.4C41.5 36 44 30.5 44 24c0-1.2-.1-2.4-.4-3.5z"/></svg>
    )
  }
  if (provider === 'microsoft') {
    return (
      <svg width="16" height="16" viewBox="0 0 21 21"><rect x="1" y="1" width="9" height="9" fill="#f25022"/><rect x="11" y="1" width="9" height="9" fill="#7fba00"/><rect x="1" y="11" width="9" height="9" fill="#00a4ef"/><rect x="11" y="11" width="9" height="9" fill="#ffb900"/></svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#1c1c18"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08l.001-.001zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
  )
}

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
    <AuthLayout title="Credential Vault" subtitle="Verify your identity to proceed" icon="lock">
      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {error && (
          <div style={{ background: '#FFDAD6', border: '1px solid rgba(186,26,26,0.25)', color: '#93000A', fontSize: 12, borderRadius: 10, padding: '10px 12px' }}>
            {error}
          </div>
        )}

        <div style={{ position: 'relative' }}>
          <label htmlFor="login-email" style={floatingLabel}>Institutional Email</label>
          <div style={inputWrap(!!errors.email)} className="e360-input-wrap">
            <span className="material-symbols-outlined" aria-hidden="true" style={{ color: 'rgba(88,65,63,0.4)', fontSize: 18 }}>alternate_email</span>
            <input id="login-email" type="email" placeholder="name@eventhub360.com" autoComplete="email" style={inputField} {...register('email')} />
          </div>
          {errors.email && <div style={{ fontSize: 11, color: e360.error, marginTop: 4 }}>{errors.email.message}</div>}
        </div>

        <div style={{ position: 'relative' }}>
          <label htmlFor="login-password" style={floatingLabel}>Access Key</label>
          <div style={inputWrap(!!errors.password)} className="e360-input-wrap">
            <span className="material-symbols-outlined" aria-hidden="true" style={{ color: 'rgba(88,65,63,0.4)', fontSize: 18 }}>key</span>
            <input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" autoComplete="current-password" style={inputField} {...register('password')} />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              style={{ background: 'transparent', border: 'none', padding: 0, display: 'flex', cursor: 'pointer' }}
            >
              <span className="material-symbols-outlined" aria-hidden="true" style={{ color: 'rgba(88,65,63,0.4)', fontSize: 18 }}>
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
          {errors.password && <div style={{ fontSize: 11, color: e360.error, marginTop: 4 }}>{errors.password.message}</div>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '-8px 2px 0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" {...register('remember')} style={{ accentColor: e360.primary, width: 15, height: 15, cursor: 'pointer' }} />
            <span style={{ fontSize: 12, color: e360.onSurfaceVariant }}>Keep session active</span>
          </label>
          <button
            type="button"
            onClick={() => message.info('Please contact your administrator to reset your access key.')}
            style={{ fontSize: 12, fontWeight: 600, color: e360.secondary, cursor: 'pointer', background: 'transparent', border: 'none', padding: 0 }}
          >
            Reset Credentials
          </button>
        </div>

        <button type="submit" disabled={loading} className="e360-cta" style={{
          width: '100%', height: 52, borderRadius: 14, border: `1px solid rgba(119,90,4,0.2)`,
          color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {loading ? 'Signing In…' : 'Enter Ecosystem'}
          {!loading && <span className="material-symbols-outlined e360-arrow" aria-hidden="true" style={{ fontSize: 18 }}>arrow_forward</span>}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: `${e360.outlineVariant}66` }} />
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(88,65,63,0.4)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Multi-Factor Gateway</span>
          <div style={{ flex: 1, height: 1, background: `${e360.outlineVariant}66` }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {(['google', 'microsoft', 'apple'] as const).map((p) => (
            <button
              key={p}
              type="button"
              aria-label={`Sign in with ${p[0].toUpperCase() + p.slice(1)} — coming soon`}
              title={`${p[0].toUpperCase() + p.slice(1)} sign-in is coming soon`}
              onClick={() => message.info(`${p[0].toUpperCase() + p.slice(1)} sign-in is coming soon.`)}
              className="e360-social-btn"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '13px 0', borderRadius: 12, border: `1px solid ${e360.outlineVariant}`, background: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
            >
              <ProviderIcon provider={p} />
            </button>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: e360.onSurfaceVariant, margin: 0 }}>
          New institution? <Link to="/signup" style={{ color: e360.primary, fontWeight: 700, textDecoration: 'none' }}>Apply for Clearance</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
