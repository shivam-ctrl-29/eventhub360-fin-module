import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useFinanceKPIs } from '../../modules/finance/hooks/useFinanceDashboard'
import { useInvoiceList } from '../../modules/finance/hooks/useInvoices'
import { formatINR } from '../../modules/finance/utils/currencyFormatter'

function InsightsPanel() {
  const navigate = useNavigate()
  const { data: kpis } = useFinanceKPIs()
  const { data: invoicePage } = useInvoiceList({ page: 1, limit: 100 })

  const invoices = invoicePage?.data ?? []
  const amounts = invoices.map((i: any) => Number(i.grandTotal ?? i.total ?? 0)).filter((n) => n > 0)
  const avg = amounts.length ? amounts.reduce((s, n) => s + n, 0) / amounts.length : 0
  const top = invoices.reduce((m: any, i: any) => {
    const v = Number(i.grandTotal ?? i.total ?? 0)
    return v > Number(m?.grandTotal ?? m?.total ?? 0) ? i : m
  }, null as any)
  const topVal = top ? Number(top.grandTotal ?? top.total ?? 0) : 0
  const pctAboveAvg = avg > 0 ? Math.round(((topVal - avg) / avg) * 100) : 0

  const reports = [
    { label: 'Cash Flow Forecast', path: '/finance/cash-flow' },
    { label: 'P&L Report', path: '/finance/pnl' },
    { label: 'GST / TDS Report', path: '/finance/gst-tds' },
  ]

  return (
    <aside style={{
      width: 280, minHeight: '100vh', background: '#FFFFFF',
      borderLeft: '1px solid #E8E0D8', position: 'fixed',
      right: 0, top: 0, bottom: 0, zIndex: 100, padding: '20px 16px', overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #E8E0D8' }}>
        <div style={{ width: 36, height: 36, background: 'rgba(196,162,77,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📊</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#C4A24D' }}>Finance Insights</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Live from your data</div>
        </div>
      </div>

      {top && pctAboveAvg > 0 && (
        <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#78350F', marginBottom: 6 }}>⚡ Largest Invoice</div>
          <div style={{ fontSize: 12, color: '#78350F', lineHeight: 1.5 }}>
            Invoice <strong>{top.invoiceNumber}</strong> ({formatINR(topVal)}) is {pctAboveAvg}% above the average invoice value.
          </div>
        </div>
      )}

      <div style={{ background: '#F8F5F1', borderRadius: 8, padding: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#94a3b8', marginBottom: 8 }}>At a Glance</div>
        {[
          { l: 'Total Revenue', v: kpis ? formatINR(kpis.totalRevenue, { compact: true }) : '—' },
          { l: 'Receivables', v: kpis ? formatINR(kpis.receivables, { compact: true }) : '—' },
          { l: 'Invoices', v: String(invoices.length) },
        ].map((s) => (
          <div key={s.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#334155', marginBottom: 5 }}>
            <span>{s.l}</span><span style={{ fontWeight: 700 }}>{s.v}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#94a3b8', marginBottom: 10 }}>
        Quick Reports
      </div>
      {reports.map((r) => (
        <div key={r.label} onClick={() => navigate(r.path)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', fontSize: 12, color: '#334155', borderBottom: '1px solid #F1EDE8', cursor: 'pointer' }}>
          <span style={{ color: '#C4A24D' }}>↗</span> {r.label}
        </div>
      ))}
    </aside>
  )
}

const financeSubLinks = [
  { label: 'CFO Dashboard',        path: '/finance/dashboard' },
  { label: 'AR / AP Aging',        path: '/finance/ar-ap-aging' },
  { label: 'Cash Flow',            path: '/finance/cash-flow' },
  { label: 'Invoices',             path: '/finance/invoices' },
  { label: 'Payments',             path: '/finance/payments' },
  { label: 'Reconciliation',       path: '/finance/reconciliation' },
  { label: 'AR Aging Report',      path: '/finance/ar-aging' },
  { label: 'Dunning',              path: '/finance/dunning' },
  { label: 'Vendor Bills',         path: '/finance/vendor-bills' },
  { label: 'Payout Schedule',      path: '/finance/payouts' },
  { label: 'Expense Approval',     path: '/finance/expenses' },
  { label: 'GST / TDS Report',     path: '/finance/gst-tds' },
  { label: 'P&L Report',           path: '/finance/pnl' },
  { label: 'Audit Trail',          path: '/finance/audit-trail' },
]

const topNavLinks = [
  { label: 'Dashboard', icon: '⊞', path: '/finance/dashboard' },
  { label: 'CRM',       icon: '👥', path: '/finance/dashboard' },
  { label: 'Sales',     icon: '🛒', path: '/finance/dashboard' },
  { label: 'Events',    icon: '📅', path: '/finance/dashboard' },
  { label: 'Vendors',   icon: '🏪', path: '/finance/dashboard' },
  { label: 'AI Hub',    icon: '🤖', path: '/finance/dashboard' },
]

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [financeOpen, setFinanceOpen] = useState(true)

  const isFinance = location.pathname.startsWith('/finance')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F0EB' }}>

      {/* ── LEFT SIDEBAR ── */}
      <aside style={{
        width: 220, minHeight: '100vh', background: '#FFFFFF',
        borderRight: '1px solid #E8E0D8', display: 'flex', flexDirection: 'column',
        position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100, overflowY: 'auto',
      }}>

        {/* Brand */}
        <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid #E8E0D8', flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#8B1A1A' }}>EventHub360</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Premium Concierge ERP</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, paddingTop: 8 }}>

          {/* Top-level links */}
          {topNavLinks.map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 16px', fontSize: 13, color: '#334155', cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}

          {/* Finance & Accounting — collapsible */}
          <div
            onClick={() => setFinanceOpen((o) => !o)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 16px', fontSize: 13, fontWeight: 600,
              color: isFinance ? '#8B1A1A' : '#334155',
              borderRight: isFinance ? '3px solid #8B1A1A' : '3px solid transparent',
              background: isFinance ? 'rgba(139,26,26,0.06)' : 'transparent',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14 }}>🏦</span>
              <span>Finance & Accounting</span>
            </div>
            <span style={{ fontSize: 10, color: '#94a3b8' }}>{financeOpen ? '▲' : '▼'}</span>
          </div>

          {/* Finance Sub-links */}
          {financeOpen && (
            <div style={{ background: '#FAFAF9', borderBottom: '1px solid #E8E0D8' }}>
              {financeSubLinks.map((sub) => {
                const active = location.pathname === sub.path
                return (
                  <NavLink
                    key={sub.path}
                    to={sub.path}
                    style={{
                      display: 'block',
                      padding: '7px 16px 7px 40px',
                      fontSize: 12,
                      color: active ? '#8B1A1A' : '#64748b',
                      fontWeight: active ? 600 : 400,
                      background: active ? 'rgba(139,26,26,0.06)' : 'transparent',
                      textDecoration: 'none',
                      borderLeft: active ? '2px solid #8B1A1A' : '2px solid transparent',
                      marginLeft: 4,
                    }}
                  >
                    {sub.label}
                  </NavLink>
                )
              })}
            </div>
          )}
        </nav>

        {/* Quick Action */}
        <div style={{ padding: '12px 16px', flexShrink: 0 }}>
          <button
            onClick={() => navigate('/finance/invoices/new')}
            style={{
              width: '100%', background: '#8B1A1A', color: '#fff',
              border: 'none', borderRadius: 8, padding: '10px 0',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            + Quick Action
          </button>
        </div>

        {/* Bottom */}
        <div style={{ borderTop: '1px solid #E8E0D8', paddingTop: 4, paddingBottom: 8, flexShrink: 0 }}>
          {[{ label: 'Help Center', icon: '❓' }, { label: 'Logout', icon: '↪' }].map((l) => (
            <div key={l.label} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 16px', fontSize: 13, color: '#64748b', cursor: 'pointer',
            }}>
              <span>{l.icon}</span><span>{l.label}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{
        marginLeft: 220, marginRight: 280, flex: 1,
        padding: 24, minHeight: '100vh', background: '#F5F0EB',
      }}>
        <Outlet />
      </main>

      {/* ── RIGHT INSIGHTS PANEL (live data) ── */}
      <InsightsPanel />
    </div>
  )
}
