import { useParams, useNavigate } from 'react-router-dom'
import { DownloadOutlined, PrinterOutlined } from '@ant-design/icons'
import { Skeleton, Alert, message } from 'antd'
import { useReceipt } from '../../hooks/usePayments'
import { formatINR } from '../../utils/currencyFormatter'
import dayjs from 'dayjs'

export default function ReceiptView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: receipt, isLoading, isError } = useReceipt(id ?? '')

  if (isLoading) return <div style={{ padding: 32 }}><Skeleton active paragraph={{ rows: 8 }} /></div>
  if (isError || !receipt) return <Alert type="error" message="Failed to load receipt." style={{ margin: 24 }} />

  const rows = [
    { label: 'Against Invoice', value: `#${receipt.invoiceId}` },
    { label: 'Payment Date', value: dayjs(receipt.paidAt).format('MMMM DD, YYYY') },
    { label: 'Payment Mode', value: receipt.mode },
    { label: 'UTR / Reference', value: receipt.gatewayRef || '—' },
    { label: 'Received By', value: 'EventHub360 Finance' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 12, color: '#94a3b8', cursor: 'pointer', marginBottom: 4 }} onClick={() => navigate('/finance/payments')}>← Back to Payments</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1a2a4a' }}>Payment Receipt</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #E8E0D8', background: '#fff', fontSize: 12, color: '#334155', cursor: 'pointer' }}><PrinterOutlined /> Print</button>
          <button onClick={() => { message.info('Use the print dialog and choose "Save as PDF"'); window.print() }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: '#8B1A1A', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}><DownloadOutlined /> Download</button>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 32, maxWidth: 600, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#8B1A1A', marginBottom: 4 }}>EventHub360</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1a2a4a' }}>PAYMENT RECEIPT</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Receipt No: RCP-{receipt.paymentId}</div>
        </div>

        <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 10, padding: '14px 20px', textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#065F46', marginBottom: 4 }}>✓ Payment Received Successfully</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#059669' }}>{formatINR(receipt.amount)}</div>
        </div>

        {rows.map((r) => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F5F0EB' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>{r.label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#1a2a4a' }}>{r.value}</span>
          </div>
        ))}

        <div style={{ textAlign: 'center', marginTop: 24, padding: '16px', background: '#F8F5F1', borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>This is a computer-generated receipt and does not require a signature.</div>
        </div>
      </div>
    </div>
  )
}
