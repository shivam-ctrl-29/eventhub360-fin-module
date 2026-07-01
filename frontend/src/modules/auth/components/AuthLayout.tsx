import type { ReactNode } from 'react'
import { useViewport } from '@shared/hooks/useViewport'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
}

const BAR_HEIGHTS = [18, 26, 22, 34, 46, 58]

export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  const { isMobile, isTablet } = useViewport()
  const showMarketingPanel = !isMobile && !isTablet

  return (
    <div style={{
      minHeight: '100vh', background: '#F5F0EB', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 64, width: '100%',
        maxWidth: showMarketingPanel ? 1080 : 440, justifyContent: 'center',
      }}>

        {/* ── Left: marketing panel (desktop only) ── */}
        {showMarketingPanel && (
          <div style={{ flex: 1, maxWidth: 460 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
              <span style={{ fontSize: 20 }}>🏦</span>
              <span style={{ fontSize: 17, fontWeight: 700, color: '#8B1A1A' }}>EventHub360</span>
            </div>

            <h1 style={{ fontSize: 38, fontWeight: 800, color: '#1a2a4a', lineHeight: 1.15, margin: 0 }}>
              Smarter Finance<br />Starts Here.
            </h1>
            <p style={{ fontSize: 15, color: '#64748b', marginTop: 16, lineHeight: 1.6, maxWidth: 380 }}>
              The institutional-grade platform for modern event finance. Precision tools for invoicing, payments, and profitability.
            </p>

            {/* Floating stat cards */}
            <div style={{ position: 'relative', marginTop: 48, height: 260 }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, width: 280,
                background: '#fff', borderRadius: 14, border: '1px solid #E8E0D8',
                boxShadow: '0 12px 32px rgba(26,42,74,0.10)', padding: '18px 20px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.5px', color: '#94a3b8', textTransform: 'uppercase' }}>Total Revenue</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>+12.4%</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1a2a4a', marginBottom: 14 }}>₹24,82,904</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 58 }}>
                  {BAR_HEIGHTS.map((h, i) => (
                    <div key={i} style={{
                      width: 16, height: h, borderRadius: 3,
                      background: i === BAR_HEIGHTS.length - 1 ? '#8B1A1A' : 'rgba(139,26,26,0.28)',
                    }} />
                  ))}
                </div>
              </div>

              <div style={{
                position: 'absolute', left: 190, top: 96, width: 230,
                background: '#fff', borderRadius: 14, border: '1px solid #E8E0D8',
                boxShadow: '0 12px 32px rgba(26,42,74,0.10)', padding: '16px 18px',
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.5px', color: '#94a3b8', textTransform: 'uppercase' }}>Event Margin</span>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#1a2a4a', margin: '6px 0 10px' }}>Score: 81.5</div>
                <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: '81%', height: '100%', background: '#C4A24D', borderRadius: 3 }} />
                </div>
              </div>

              <div style={{
                position: 'absolute', left: 24, top: 190, width: 220,
                background: '#fff', borderRadius: 14, border: '1px solid #E8E0D8',
                boxShadow: '0 12px 32px rgba(26,42,74,0.10)', padding: '14px 18px',
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.5px', color: '#94a3b8', textTransform: 'uppercase' }}>Active Branches</span>
                <div style={{ display: 'flex', marginTop: 8 }}>
                  {['MUM', 'DEL', 'BLR'].map((code, i) => (
                    <div key={code} title={code} style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: ['#8B1A1A', '#1a2a4a', '#C4A24D'][i],
                      color: '#fff', fontSize: 9, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid #fff', marginLeft: i === 0 ? 0 : -10,
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
          width: '100%', maxWidth: 420, background: '#fff', borderRadius: 16,
          border: '1px solid #E8E0D8', boxShadow: '0 20px 48px rgba(26,42,74,0.12)',
          padding: '40px 36px',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a2a4a', margin: 0 }}>{title}</h2>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 8, lineHeight: 1.5 }}>{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
