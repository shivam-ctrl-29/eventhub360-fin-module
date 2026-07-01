import type { ReactNode } from 'react'
import { useViewport } from '@shared/hooks/useViewport'
import { formatINR } from '../../finance/utils/currencyFormatter'
import { useLoginSnapshot } from '../hooks/useLoginSnapshot'
import { message } from '@shared/lib/antdStatic'
import { e360 } from '../theme'
import '../auth.css'

interface AuthLayoutProps {
  title: string
  subtitle: string
  icon: string
  children: ReactNode
}

const navLink: React.CSSProperties = {
  fontSize: 13, letterSpacing: '0.03em', color: e360.onSurfaceVariant,
  fontWeight: 500, cursor: 'default', userSelect: 'none',
}

export default function AuthLayout({ title, subtitle, icon, children }: AuthLayoutProps) {
  const { isMobile } = useViewport()
  const snap = useLoginSnapshot()

  return (
    <div className="e360-page">
      <div className="e360-grain" />
      <div className="e360-atmosphere" />

      {/* ── Top Nav ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: isMobile ? '18px 20px' : '24px 64px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, color: e360.primary, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>EventHub360</span>
          {!isMobile && (
            <>
              <span style={{ color: 'rgba(88,65,63,0.3)', fontWeight: 300 }}>|</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: e360.secondary, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Institutional</span>
            </>
          )}
        </div>
        {!isMobile && (
          <div style={{ display: 'flex', gap: 32 }}>
            <span style={{ ...navLink, color: e360.primary, fontWeight: 600, borderBottom: `2px solid ${e360.secondary}`, paddingBottom: 4 }}>Ecosystem</span>
            <span style={navLink}>Finance</span>
            <span style={navLink}>Operations</span>
          </div>
        )}
        <button
          onClick={() => message.info('Priority support is available to verified institutional accounts.')}
          style={{
            padding: isMobile ? '7px 12px' : '9px 20px', borderRadius: 9999, border: `1px solid rgba(69,0,4,0.18)`,
            fontSize: isMobile ? 11 : 12, fontWeight: 600, color: e360.primary, background: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(8px)', cursor: 'pointer', letterSpacing: '0.02em', whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          {isMobile ? 'Support' : 'Priority Support'}
        </button>
      </nav>

      {/* ── Main grid ── */}
      <main style={{
        position: 'relative', zIndex: 10, width: '100%', maxWidth: 1600, margin: '0 auto',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 24,
        padding: isMobile ? '96px 20px 48px' : '140px 64px 64px',
        minHeight: '100vh', boxSizing: 'border-box',
      }}>

        {/* ── Left: marketing / live snapshot (hidden on mobile+tablet) ── */}
        <div className="e360-marketing-col" style={{ flex: '1 1 480px', display: 'flex', flexDirection: 'column', gap: 32, minWidth: 0 }}>
          <div>
            <h1 className="e360-headline" style={{ fontSize: 44, fontWeight: 800, color: e360.primary, lineHeight: 1.12, letterSpacing: '-0.02em', margin: 0 }}>
              EventHub360<br />
              <span style={{ color: e360.secondary, opacity: 0.85 }}>Secure Access.</span>
            </h1>
            <p style={{ fontSize: 16, color: 'rgba(88,65,63,0.8)', marginTop: 14, maxWidth: 440, lineHeight: 1.6 }}>
              Real-time financial analytics and transactional infrastructure for event operations — invoicing, payments, and profitability, live.
            </p>
          </div>

          {/* Total Liquidity card */}
          <div className="e360-glass e360-floating" style={{ borderRadius: 24, padding: 28, borderLeft: `4px solid ${e360.primary}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: e360.onSurfaceVariant, margin: '0 0 6px' }}>Total Liquidity</p>
                <h2 style={{ fontSize: 34, fontWeight: 800, color: e360.primary, margin: 0, letterSpacing: '-0.01em' }}>
                  {snap.isLoading ? '—' : formatINR(snap.totalLiquidity, { compact: true })}
                </h2>
              </div>
              {snap.momGrowthPct !== null && (
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: snap.momGrowthPct >= 0 ? e360.secondary : e360.error, fontWeight: 700, fontSize: 13, justifyContent: 'flex-end' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{snap.momGrowthPct >= 0 ? 'trending_up' : 'trending_down'}</span>
                    {snap.momGrowthPct >= 0 ? '+' : ''}{snap.momGrowthPct}%
                  </span>
                  <p style={{ fontSize: 11, color: 'rgba(88,65,63,0.5)', margin: '2px 0 0' }}>v. last month</p>
                </div>
              )}
            </div>

            {/* mini bar chart — real monthly revenue */}
            {snap.bars.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 6, height: 72, padding: '0 4px', marginBottom: 16 }}>
                {snap.bars.map((b, i) => (
                  <div
                    key={b.month + i}
                    className="e360-bar"
                    title={`${b.month}: ${formatINR(b.revenue, { compact: true })}`}
                    style={{
                      width: '100%', borderRadius: '6px 6px 2px 2px',
                      height: `${Math.max(b.pct, 4)}%`,
                      background: i === snap.bars.length - 1 ? e360.primary : e360.surfaceContainerHigh,
                      boxShadow: i === snap.bars.length - 1 ? `0 8px 16px rgba(69,0,4,0.18)` : 'none',
                    }}
                  />
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, paddingTop: 14, borderTop: `1px solid ${e360.outlineVariant}55` }}>
              <div>
                <span style={{ fontSize: 11, color: 'rgba(88,65,63,0.55)', display: 'block' }}>Net Margin</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: e360.primary }}>{snap.netMarginPct !== null ? `${snap.netMarginPct}%` : '—'}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, color: 'rgba(88,65,63,0.55)', display: 'block' }}>Avg Collection</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', fontSize: 18, fontWeight: 700, color: e360.secondary }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                  {snap.avgCollectionDays !== null ? `${snap.avgCollectionDays}d` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Micro widgets */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div className="e360-glass e360-floating-delayed" style={{ borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 200px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: e360.secondaryContainer, display: 'flex', alignItems: 'center', justifyContent: 'center', color: e360.onSecondaryContainer, flexShrink: 0 }}>
                <span className="material-symbols-outlined">payments</span>
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: e360.onSurfaceVariant, margin: 0, letterSpacing: '0.06em' }}>Recent Flow</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: e360.primary, margin: '2px 0 0' }}>
                  {snap.recentPaymentAmount !== null ? formatINR(snap.recentPaymentAmount) : '—'}
                </p>
              </div>
            </div>
            <div className="e360-glass e360-floating-more-delayed" style={{ borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 200px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ffdad6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: e360.primaryContainer, flexShrink: 0 }}>
                <span className="material-symbols-outlined">fact_check</span>
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: e360.onSurfaceVariant, margin: 0, letterSpacing: '0.06em' }}>Collection Rate</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: e360.primary, margin: '2px 0 0' }}>
                  {snap.collectionRatePct !== null ? `${snap.collectionRatePct}%` : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: auth card ── */}
        <div style={{ flex: '1 1 420px', display: 'flex', justifyContent: 'center', position: 'relative', minWidth: 0 }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 190, height: 190, background: e360.burgundyGlow, borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />

          {!isMobile && (
            <div className="e360-glass e360-floating-delayed" style={{
              position: 'absolute', top: 4, right: 4, zIndex: 20, borderRadius: 9999,
              padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span className="e360-pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              <span style={{ fontSize: 11, color: e360.onSurfaceVariant, fontWeight: 500 }}>Live Protocol</span>
            </div>
          )}

          <div className="e360-glass e360-card-hover" style={{ width: '100%', maxWidth: 440, borderRadius: 24, padding: isMobile ? 28 : 36, position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
              <div style={{ width: 60, height: 60, background: e360.surfaceContainer, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, border: '1px solid rgba(255,255,255,0.5)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 28, color: e360.primary, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: e360.primary, margin: 0 }}>{title}</h2>
              <p style={{ fontSize: 13, color: 'rgba(88,65,63,0.7)', marginTop: 6, textAlign: 'center' }}>{subtitle}</p>
            </div>
            {children}
          </div>

          <div style={{ position: 'absolute', bottom: -8, left: -8, width: 90, height: 90, borderLeft: `2px solid rgba(119,90,4,0.2)`, borderBottom: `2px solid rgba(119,90,4,0.2)`, borderRadius: '0 0 0 24px', pointerEvents: 'none' }} />
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{
        position: 'relative', zIndex: 10, display: 'flex', flexWrap: 'wrap', gap: 16,
        justifyContent: 'space-between', alignItems: 'center',
        padding: isMobile ? '20px' : '24px 64px',
      }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', opacity: 0.7 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: e360.secondary, textTransform: 'uppercase' }}>256-bit Encryption</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(88,65,63,0.3)' }} />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: e360.secondary, textTransform: 'uppercase' }}>Full Audit Trail</span>
        </div>
        <div style={{ fontSize: 10, color: 'rgba(88,65,63,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          © {new Date().getFullYear()} EventHub360 Finance
        </div>
      </footer>
    </div>
  )
}
