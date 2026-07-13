import { useNavigate, useParams } from 'react-router-dom'
import { message } from '@shared/lib/antdStatic'
import { DownloadOutlined, EditOutlined, PrinterOutlined } from '@ant-design/icons'
import { Skeleton, Alert } from 'antd'
import { useInvoice } from '../../hooks/useInvoices'
import { useCompany } from '../../hooks/useFinanceDashboard'
import { formatINR } from '../../utils/currencyFormatter'
import dayjs from 'dayjs'

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  overdue:   { bg: '#FEE2E2', color: '#991B1B' },
  paid:      { bg: '#D1FAE5', color: '#065F46' },
  sent:      { bg: '#FEF3C7', color: '#92400E' },
  draft:     { bg: '#F1F5F9', color: '#475569' },
  partial:   { bg: '#EDE9FE', color: '#5B21B6' },
  cancelled: { bg: '#F1F5F9', color: '#94a3b8' },
}

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: invoice, isLoading, isError } = useInvoice(id ?? '')
  const { data: company } = useCompany()

  if (isLoading) return <div style={{ padding: 32 }}><Skeleton active paragraph={{ rows: 10 }} /></div>
  if (isError || !invoice) return <Alert type="error" message="Failed to load invoice." style={{ margin: 24 }} />

  const statusStyle = STATUS_STYLE[invoice.status] ?? STATUS_STYLE['draft']

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4, cursor: 'pointer' }} onClick={() => navigate('/finance/invoices')}>← Back to Invoices</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1a2a4a' }}>Invoice {invoice.invoiceNumber}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #E8E0D8', background: '#fff', fontSize: 13, color: '#334155', cursor: 'pointer' }}><PrinterOutlined /> Print</button>
          <button onClick={() => { message.info('Use the print dialog and choose "Save as PDF"'); window.print() }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #E8E0D8', background: '#fff', fontSize: 13, color: '#334155', cursor: 'pointer' }}><DownloadOutlined /> PDF</button>
          <button onClick={() => navigate(`/finance/invoices/${id}/edit`)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: '#8B1A1A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}><EditOutlined /> Edit</button>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 32, maxWidth: 800 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#8B1A1A' }}>{company?.name ?? 'EventHub360'}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Premium Concierge ERP</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 8, lineHeight: 1.6 }}>
              {company?.gstin && <>GSTIN: {company.gstin}<br /></>}
              {company?.pan && <>PAN: {company.pan}</>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#1a2a4a', marginBottom: 4 }}>INVOICE</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#8B1A1A' }}>{invoice.invoiceNumber}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 8, lineHeight: 1.6 }}>
              Date: {dayjs((invoice as any).issueDate ?? invoice.createdAt).format('MMM DD, YYYY')}<br />
              Due: {(invoice as any).dueDate ? dayjs((invoice as any).dueDate).format('MMM DD, YYYY') : '—'}
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: statusStyle.bg, color: statusStyle.color, marginTop: 8, display: 'inline-block', textTransform: 'capitalize' }}>
              {invoice.status}
            </span>
          </div>
        </div>

        <div style={{ background: '#F8F5F1', borderRadius: 8, padding: '14px 16px', marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Bill To</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2a4a' }}>{(invoice as any).customer?.name ?? 'Client'}</div>
          {(invoice as any).customer?.email && <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{(invoice as any).customer.email}</div>}
          {(invoice as any).customer?.gstin && <div style={{ fontSize: 12, color: '#64748b' }}>GSTIN: {(invoice as any).customer.gstin}</div>}
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 110px 70px 120px', padding: '8px 12px', background: '#1a2a4a', borderRadius: '6px 6px 0 0' }}>
            {['DESCRIPTION', 'QTY', 'RATE', 'GST', 'AMOUNT'].map((h) => <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px' }}>{h}</div>)}
          </div>
          {invoice.lineItems.map((item) => (
            <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 110px 70px 120px', padding: '12px', alignItems: 'center', borderLeft: '1px solid #E8E0D8', borderRight: '1px solid #E8E0D8', borderBottom: '1px solid #F5F0EB' }}>
              <div style={{ fontSize: 13, color: '#334155' }}>{item.description}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{item.quantity}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{formatINR(item.unitPrice)}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{(item as any).gstRate ?? 18}%</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2a4a' }}>{formatINR((item as any).amount ?? item.total)}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 260 }}>
            {[{ l: 'Subtotal', v: formatINR(invoice.subtotal) }, { l: 'GST Total', v: formatINR((invoice as any).totalGST ?? (invoice as any).taxTotal ?? 0) }].map((r) => (
              <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>{r.l}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{r.v}</span>
              </div>
            ))}
            <div style={{ borderTop: '2px solid #1a2a4a', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1a2a4a' }}>Total Due</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#8B1A1A' }}>{formatINR((invoice as any).grandTotal ?? invoice.total)}</span>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #E8E0D8', marginTop: 24, paddingTop: 16, fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
          {invoice.termsAndConditions && <><strong style={{ color: '#334155' }}>Terms:</strong> {invoice.termsAndConditions}<br /></>}
          {invoice.notes && <><strong style={{ color: '#334155' }}>Notes:</strong> {invoice.notes}</>}
        </div>
      </div>
    </div>
  )
}
