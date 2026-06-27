import { useState } from 'react'
import { useDebounce } from '@shared/hooks/useDebounce'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons'
import { Skeleton, Alert, message } from 'antd'
import { useGSTSummary, useGSTComplianceScore, useHSNBreakdown } from '../../hooks/useGSTReport'
import { formatINR } from '../../utils/currencyFormatter'
import { downloadCSV } from '../../utils/exportHelper'
import dayjs from 'dayjs'

const CURRENT_YEAR = `${new Date().getFullYear() - 1}-${String(new Date().getFullYear()).slice(2)}`
const CURRENT_PERIOD = dayjs().format('MMM YYYY')

function CircularGauge({ pct, label }: { pct: number; label: string }) {
  const r = 54
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div style={{ position: 'relative', width: 140, height: 140 }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#F1F5F9" strokeWidth="10" />
        <circle cx="70" cy="70" r={r} fill="none" stroke="#059669" strokeWidth="10" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#059669' }}>{pct.toFixed(1)}%</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      </div>
    </div>
  )
}

export default function GSTTDSReport() {
  const [localSearch, setLocalSearch] = useState('')
  const search = useDebounce(localSearch, 300)

  const { data: gstSummaries, isLoading: summaryLoading, isError: summaryError } = useGSTSummary(CURRENT_YEAR)
  const { data: complianceScore, isLoading: scoreLoading } = useGSTComplianceScore()
  const { data: hsnPage, isLoading: hsnLoading } = useHSNBreakdown({ page: 1, limit: 20, period: CURRENT_PERIOD })

  const summaries = gstSummaries ?? []
  const hsnRows   = hsnPage?.data ?? []

  const itcAvailable = summaries.reduce((s, g) => s + g.itcAvailable, 0)
  const itcUtilized  = summaries.reduce((s, g) => s + g.itcUtilized, 0)
  const itcPct       = itcAvailable > 0 ? Math.round((itcUtilized / itcAvailable) * 100) : 0
  const pendingFiling = summaries.find((g) => g.filingStatus === 'pending')

  const chartData = summaries.slice(0, 6).map((g) => ({
    month:  dayjs(g.period, 'MMM YYYY').format('MMM'),
    output: Math.round(g.gstOutput / 1000),
    input:  Math.round(g.gstInput  / 1000),
  }))

  const filteredHSN = search
    ? hsnRows.filter((r) => r.hsnCode.includes(search) || r.description.toLowerCase().includes(search.toLowerCase()))
    : hsnRows

  const exportGSTR = () => {
    if (summaries.length === 0) { message.info('No GST data to export'); return }
    downloadCSV('gstr-summary', summaries.map((g) => ({
      period: g.period, returnType: g.returnType, gstOutput: g.gstOutput, gstInput: g.gstInput,
      netPayable: g.netPayable, status: g.filingStatus, dueDate: g.dueDate,
    })))
    message.success(`Exported ${summaries.length} GST returns`)
  }

  const fileReturn = (period: string) => {
    message.success(`GSTR filing initiated for ${period}`)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1a2a4a' }}>GST / TDS Compliance Report</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>Tax filing status, ITC reconciliation and statutory reporting</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #E8E0D8', borderRadius: 10, padding: '8px 14px', width: 260 }}>
            <SearchOutlined style={{ color: '#94a3b8', fontSize: 13 }} />
            <input value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder="Search tax invoices, HSN codes..." style={{ border: 'none', outline: 'none', fontSize: 12, color: '#334155', background: 'transparent', width: '100%' }} />
          </div>
          <button onClick={exportGSTR} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#8B1A1A', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <DownloadOutlined /> Export GSTR
          </button>
        </div>
      </div>

      {summaryError && <Alert type="error" message="Failed to load GST data." style={{ marginBottom: 16 }} />}

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {scoreLoading
            ? <Skeleton active paragraph={{ rows: 2 }} style={{ width: 140 }} />
            : <CircularGauge pct={complianceScore?.score ?? 0} label={complianceScore?.grade ?? '—'} />
          }
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8, textAlign: 'center' }}>GST Compliance Score</div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>ITC Available</div>
          {summaryLoading
            ? <Skeleton active paragraph={{ rows: 2 }} title={false} />
            : (
              <>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#1a2a4a', marginBottom: 8 }}>{formatINR(itcAvailable, { compact: true })}</div>
                <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, marginBottom: 6 }}>
                  <div style={{ height: '100%', width: `${itcPct}%`, background: '#C4A24D', borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{itcPct}% of projected credit utilized</div>
              </>
            )
          }
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #8B1A1A', padding: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#8B1A1A' }} />
          <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>TDS Liability</div>
          {summaryLoading
            ? <Skeleton active paragraph={{ rows: 2 }} title={false} />
            : (
              <>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#8B1A1A', marginBottom: 6 }}>{formatINR(pendingFiling?.netPayable ?? 0, { compact: true })}</div>
                {pendingFiling && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#DC2626', background: '#FEE2E2', padding: '3px 10px', borderRadius: 20, marginBottom: 8 }}>
                    ⏱ Due {dayjs(pendingFiling.dueDate).format('MMM DD')}
                  </div>
                )}
                <div style={{ fontSize: 11, color: '#64748b' }}>Action Required: Verify Deductions</div>
              </>
            )
          }
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20, marginBottom: 20 }}>
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a' }}>GST Output vs Input</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Monthly credit reconciliation trend (₹ in thousands)</div>
        </div>
        {summaryLoading
          ? <Skeleton active paragraph={{ rows: 3 }} />
          : chartData.length > 0
            ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barSize={20} barGap={4}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip formatter={(v: number, name: string) => [`₹${v}K`, name === 'output' ? 'GST Output Payable' : 'GST Input ITC']} contentStyle={{ borderRadius: 8, border: '1px solid #E8E0D8', fontSize: 11 }} />
                  <Legend formatter={(value) => value === 'output' ? 'GST Output Payable' : 'GST Input ITC'} wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
                  <Bar dataKey="output" fill="#8B1A1A" radius={[4, 4, 0, 0]} name="output" />
                  <Bar dataKey="input"  fill="#C4A24D" radius={[4, 4, 0, 0]} name="input"  />
                </BarChart>
              </ResponsiveContainer>
            )
            : <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 13 }}>No GST chart data available</div>
        }
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '16px 20px 10px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a' }}>HSN-wise Tax Breakdown</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Category-level GST output and input credit summary</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 80px 130px 80px 120px', padding: '8px 20px', background: '#1a2a4a' }}>
          {['HSN CODE', 'DESCRIPTION', 'QTY', 'TAXABLE VALUE', 'GST %', 'GST AMOUNT'].map((h) => (
            <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px' }}>{h}</div>
          ))}
        </div>
        {hsnLoading && <div style={{ padding: 20 }}><Skeleton active paragraph={{ rows: 4 }} /></div>}
        {!hsnLoading && filteredHSN.length === 0 && <div style={{ padding: '32px', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>No HSN entries found</div>}
        {!hsnLoading && filteredHSN.map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 80px 130px 80px 120px', padding: '13px 20px', alignItems: 'center', borderTop: '1px solid #F5F0EB' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#8B1A1A' }}>{r.hsnCode}</div>
            <div style={{ fontSize: 12, color: '#334155' }}>{r.description}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{r.quantity}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1a2a4a' }}>{formatINR(r.taxableValue)}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{r.gstRate}%</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#8B1A1A' }}>{formatINR(r.gstAmount)}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 10px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a' }}>Monthly Filing Status Logs</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>GSTR return history and compliance audit trail</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 120px 120px 90px 100px', padding: '8px 20px', background: '#1a2a4a' }}>
          {['PERIOD', 'DETAILS', 'NET PAYABLE', 'DUE DATE', 'STATUS', 'ACTIONS'].map((h) => (
            <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px' }}>{h}</div>
          ))}
        </div>
        {summaryLoading && <div style={{ padding: 20 }}><Skeleton active paragraph={{ rows: 4 }} /></div>}
        {!summaryLoading && summaries.length === 0 && <div style={{ padding: '32px', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>No filing records found</div>}
        {!summaryLoading && summaries.map((r, i) => {
          const isFiled = r.filingStatus === 'filed'
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 120px 120px 90px 100px', padding: '13px 20px', alignItems: 'center', borderTop: '1px solid #F5F0EB' }}>
              <div style={{ fontSize: 12, color: '#334155', fontWeight: 500 }}>{r.period}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Output: {formatINR(r.gstOutput, { compact: true })} / Input: {formatINR(r.gstInput, { compact: true })}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1a2a4a' }}>{formatINR(r.netPayable, { compact: true })}</div>
              <div style={{ fontSize: 12, color: '#334155' }}>{dayjs(r.dueDate).format('MMM DD, YYYY')}</div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: isFiled ? '#D1FAE5' : '#FEF3C7', color: isFiled ? '#065F46' : '#92400E', textTransform: 'capitalize' }}>
                {isFiled ? '✓' : '⏱'} {r.filingStatus}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => message.info(`${r.period}: Output ${formatINR(r.gstOutput)} · Input ${formatINR(r.gstInput)} · Net Payable ${formatINR(r.netPayable)}`)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #E8E0D8', background: '#fff', color: '#334155', cursor: 'pointer' }}>View</button>
                {!isFiled && <button onClick={() => fileReturn(r.period)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#8B1A1A', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>File</button>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
