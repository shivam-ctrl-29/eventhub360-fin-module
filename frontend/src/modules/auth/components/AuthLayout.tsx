import type { ReactNode } from 'react'
import { useViewport } from '@shared/hooks/useViewport'
import { AuthScaleProvider } from './AuthScaleContext'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
}

const BAR_HEIGHTS = [18, 26, 22, 34, 46, 58]

export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  const { isMobile, isTablet, width } = useViewport()
  const showMarketingPanel = !isMobile && !isTablet
  // Scale the whole composition up on large monitors so it doesn't look like a
  // tiny centered island in a sea of empty background.
  const isLarge = width >= 1440
  const s = isLarge ? 1.18 : 1

  return (
    <div style={{
      minHeight: '100vh', background: '#F5F0EB', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: isLarge ? 88 : 64, width: '100%',
        maxWidth: showMarketingPanel ? (isLarge ? 1280 : 1080) : (isLarge ? 480 : 440),
        justifyContent: 'center',
      }}>

        {/* ── Left: marketing panel (desktop only) ── */}
        {showMarketingPanel && (
          <div style={{ flex: 1, maxWidth: 460 * s }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 * s }}>
              <span style={{ fontSize: 20 * s }}>🏦</span>
              <span style={{ fontSize: 17 * s, fontWeight: 700, color: '#8B1A1A' }}>EventHub360</span>
            </div>

            <h1 style={{ fontSize: 38 * s, fontWeight: 800, color: '#1a2a4a', lineHeight: 1.15, margin: 0 }}>
              Smarter Finance<br />Starts Here.
            </h1>
            <p style={{ fontSize: 15 * s, color: '#64748b', marginTop: 16 * s, lineHeight: 1.6, maxWidth: 380 * s }}>
              The institutional-grade platform for modern event finance. Precision tools for invoicing, payments, and profitability.
            </p>

            {/* Floating stat cards */}
            <div style={{ position: 'relative', marginTop: 48 * s, height: 260 * s }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, width: 280 * s,
                background: '#fff', borderRadius: 14, border: '1px solid #E8E0D8',
                boxShadow: '0 12px 32px rgba(26,42,74,0.10)', padding: `${18 * s}px ${20 * s}px`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 10 * s, fontWeight: 700, letterSpacing: '0.5px', color: '#94a3b8', textTransform: 'uppercase' }}>Total Revenue</span>
                  <span style={{ fontSize: 11 * s, fontWeight: 700, color: '#059669' }}>+12.4%</span>
                </div>
                <div style={{ fontSize: 22 * s, fontWeight: 800, color: '#1a2a4a', marginBottom: 14 * s }}>₹24,82,904</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 * s, height: 58 * s }}>
                  {BAR_HEIGHTS.map((h, i) => (
                    <div key={i} style={{
                      width: 16 * s, height: h * s, borderRadius: 3,
                      background: i === BAR_HEIGHTS.length - 1 ? '#8B1A1A' : 'rgba(139,26,26,0.28)',
                    }} />
                  ))}
                </div>
              </div>

              <div style={{
                position: 'absolute', left: 190 * s, top: 96 * s, width: 230 * s,
                background: '#fff', borderRadius: 14, border: '1px solid #E8E0D8',
                boxShadow: '0 12px 32px rgba(26,42,74,0.10)', padding: `${16 * s}px ${18 * s}px`,
              }}>
                <span style={{ fontSize: 10 * s, fontWeight: 700, letterSpacing: '0.5px', color: '#94a3b8', textTransform: 'uppercase' }}>Event Margin</span>
                <div style={{ fontSize: 18 * s, fontWeight: 800, color: '#1a2a4a', margin: `${6 * s}px 0 ${10 * s}px` }}>Score: 81.5</div>
                <div style={{ height: 6 * s, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: '81%', height: '100%', background: '#C4A24D', borderRadius: 3 }} />
                </div>
              </div>

              <div style={{
                position: 'absolute', left: 24 * s, top: 190 * s, width: 220 * s,
                background: '#fff', borderRadius: 14, border: '1px solid #E8E0D8',
                boxShadow: '0 12px 32px rgba(26,42,74,0.10)', padding: `${14 * s}px ${18 * s}px`,
              }}>
                <span style={{ fontSize: 10 * s, fontWeight: 700, letterSpacing: '0.5px', color: '#94a3b8', textTransform: 'uppercase' }}>Active Branches</span>
                <div style={{ display: 'flex', marginTop: 8 * s }}>
                  {['MUM', 'DEL', 'BLR'].map((code, i) => (
                    <div key={code} title={code} style={{
                      width: 30 * s, height: 30 * s, borderRadius: '50%',
                      background: ['#8B1A1A', '#1a2a4a', '#C4A24D'][i],
                      color: '#fff', fontSize: 9 * s, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid #fff', marginLeft: i === 0 ? 0 : -10 * s,
                    }}>
                      {code.slice(0, 2)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Right: auth card ── */}
        <div style={{
          width: '100%', maxWidth: 420 * s, background: '#fff', borderRadius: 16,
          border: '1px solid #E8E0D8', boxShadow: '0 20px 48px rgba(26,42,74,0.12)',
          padding: `${40 * s}px ${36 * s}px`,
        }}>
          <div style={{ textAlign: 'center', marginBottom: 28 * s }}>
            <h2 style={{ fontSize: 22 * s, fontWeight: 800, color: '#1a2a4a', margin: 0 }}>{title}</h2>
            <p style={{ fontSize: 13 * s, color: '#94a3b8', marginTop: 8, lineHeight: 1.5 }}>{subtitle}</p>
          </div>
          <AuthScaleProvider value={s}>{children}</AuthScaleProvider>
        </div>
      </div>
    </div>
  )
}
