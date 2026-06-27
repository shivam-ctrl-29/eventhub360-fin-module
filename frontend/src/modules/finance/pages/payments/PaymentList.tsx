import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { SearchOutlined, PlusOutlined, DollarOutlined } from '@ant-design/icons'
import { useDebounce } from '@shared/hooks/useDebounce'
import { Skeleton, Alert, message, Modal } from 'antd'
import { usePaymentList, useRecordPayment } from '../../hooks/usePayments'
import { usePaymentStore } from '../../store/paymentStore'
import { usePermissions } from '@shared/hooks/usePermissions'
import { formatINR } from '../../utils/currencyFormatter'
import dayjs from 'dayjs'

const paymentSchema = z.object({
  invoiceId:   z.string().min(1, 'Invoice ID is required'),
  amount:      z.number({ invalid_type_error: 'Amount is required' }).positive('Must be greater than 0'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  paymentMode: z.enum(['bank_transfer', 'upi', 'cheque', 'cash', 'card']),
  utrNumber:   z.string().optional(),
})

type PaymentFormData = z.infer<typeof paymentSchema>

const ERR: React.CSSProperties = { fontSize: 10, color: '#DC2626', marginTop: 3 }
const INPUT: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '1px solid #E8E0D8', borderRadius: 8, fontSize: 12, color: '#334155', outline: 'none', boxSizing: 'border-box' }
const INPUT_ERR: React.CSSProperties = { ...INPUT, border: '1px solid #DC2626' }

const MODE_COLORS: Record<string, { bg: string; color: string }> = {
  upi:           { bg: '#DBEAFE', color: '#1E40AF' },
  bank_transfer: { bg: '#D1FAE5', color: '#065F46' },
  cheque:        { bg: '#FEF3C7', color: '#92400E' },
  cash:          { bg: '#F1F5F9', color: '#475569' },
  card:          { bg: '#EDE9FE', color: '#5B21B6' },
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  settled:    { bg: '#D1FAE5', color: '#065F46' },
  processing: { bg: '#DBEAFE', color: '#1E40AF' },
  pending:    { bg: '#FEF3C7', color: '#92400E' },
  failed:     { bg: '#FEE2E2', color: '#991B1B' },
}

export default function PaymentList() {
  const { can } = usePermissions()
  const { searchQuery, currentPage, pageSize, recordPaymentModalOpen, setSearchQuery, setCurrentPage, openRecordModal, closeRecordModal } = usePaymentStore()
  const [localSearch, setLocalSearch] = useState(searchQuery)
  const debouncedSearch = useDebounce(localSearch, 300)

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { paymentMode: 'bank_transfer' },
  })

  useEffect(() => {
    setSearchQuery(debouncedSearch)
    setCurrentPage(1)
  }, [debouncedSearch, setSearchQuery, setCurrentPage])

  const [sortBy, setSortBy] = useState<string | undefined>(undefined)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const handleSort = (col: string) => {
    if (sortBy === col) { setSortOrder((p) => p === 'asc' ? 'desc' : 'asc') } else { setSortBy(col); setSortOrder('desc') }
    setCurrentPage(1)
  }

  const { data, isLoading, isError } = usePaymentList({ page: currentPage, limit: pageSize, search: debouncedSearch || undefined, sortBy, sortOrder })
  const recordPayment = useRecordPayment()

  const payments = data?.data ?? []
  const total = data?.total ?? 0

  const handleSearch = (val: string) => { setLocalSearch(val) }

  const onSubmit = async (formData: PaymentFormData) => {
    try {
      await recordPayment.mutateAsync({
        invoiceId:   formData.invoiceId,
        amount:      formData.amount,
        paymentMode: formData.paymentMode,
        paymentDate: formData.paymentDate,
        utrNumber:   formData.utrNumber || undefined,
      })
      message.success('Payment recorded successfully')
      closeRecordModal()
      reset()
    } catch {
      message.error('Failed to record payment. Please try again.')
    }
  }

  const handleCancel = () => { closeRecordModal(); reset() }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1a2a4a' }}>Payment Recording</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>Track advances, instalments and milestone payments</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #E8E0D8', borderRadius: 8, padding: '7px 12px', width: 220 }}>
            <SearchOutlined style={{ color: '#94a3b8', fontSize: 13 }} />
            <input value={localSearch} onChange={(e) => handleSearch(e.target.value)} placeholder="Search payments..." style={{ border: 'none', outline: 'none', fontSize: 12, background: 'transparent', width: '100%', color: '#334155' }} />
          </div>
          {can('payment.create') && (
            <button onClick={openRecordModal} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: '#8B1A1A', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <PlusOutlined /> Record Payment
            </button>
          )}
        </div>
      </div>

      {isError && <Alert type="error" message="Failed to load payments." style={{ marginBottom: 16 }} />}

      {/* Record Payment Modal */}
      <Modal
        title="Record New Payment"
        open={recordPaymentModalOpen}
        onCancel={handleCancel}
        onOk={handleSubmit(onSubmit)}
        okText="Save Payment"
        confirmLoading={recordPayment.isPending}
        okButtonProps={{ style: { background: '#8B1A1A', borderColor: '#8B1A1A' } }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: '12px 0' }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Invoice ID *</label>
            <input {...register('invoiceId')} placeholder="INV-..." style={errors.invoiceId ? INPUT_ERR : INPUT} />
            {errors.invoiceId && <div style={ERR}>{errors.invoiceId.message}</div>}
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Amount (₹) *</label>
            <Controller control={control} name="amount" render={({ field }) => (
              <input type="number" placeholder="0.00" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? undefined : +e.target.value)} style={errors.amount ? INPUT_ERR : INPUT} />
            )} />
            {errors.amount && <div style={ERR}>{errors.amount.message}</div>}
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Payment Date *</label>
            <input type="date" {...register('paymentDate')} style={errors.paymentDate ? INPUT_ERR : INPUT} />
            {errors.paymentDate && <div style={ERR}>{errors.paymentDate.message}</div>}
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>UTR / Cheque No.</label>
            <input {...register('utrNumber')} placeholder="Reference number" style={INPUT} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Payment Mode</label>
            <Controller control={control} name="paymentMode" render={({ field }) => (
              <select {...field} style={{ width: '100%', padding: '8px 12px', border: '1px solid #E8E0D8', borderRadius: 8, fontSize: 12, color: '#334155', outline: 'none' }}>
                {[['bank_transfer', 'Bank Transfer'], ['upi', 'UPI'], ['cheque', 'Cheque'], ['cash', 'Cash'], ['card', 'Card']].map(([val, lbl]) => (
                  <option key={val} value={val}>{lbl}</option>
                ))}
              </select>
            )} />
          </div>
        </div>
      </Modal>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: 700 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '140px 1.5fr 140px 130px 130px 110px 110px', padding: '8px 20px', background: '#1a2a4a' }}>
          {['PAY ID', 'CLIENT', 'INVOICE', 'MODE', 'AMOUNT', 'DATE', 'STATUS'].map((h) => {
            const colKey = h === 'AMOUNT' ? 'amount' : h === 'DATE' ? 'paymentDate' : null
            const isActive = colKey && sortBy === colKey
            return (
              <div key={h} onClick={colKey ? () => handleSort(colKey) : undefined} style={{ fontSize: 10, fontWeight: 700, color: isActive ? '#fff' : '#94a3b8', letterSpacing: '0.5px', cursor: colKey ? 'pointer' : 'default', userSelect: 'none' }}>
                {h}{isActive ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : ''}
              </div>
            )
          })}
        </div>

        {isLoading && (
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} active paragraph={{ rows: 1 }} />)}
          </div>
        )}

        {!isLoading && payments.length === 0 && (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <DollarOutlined style={{ fontSize: 36, color: '#cbd5e1', marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>No payments recorded yet</div>
          </div>
        )}

        {!isLoading && payments.map((p, i) => {
          const modeStyle = MODE_COLORS[p.paymentMode] ?? { bg: '#F1F5F9', color: '#475569' }
          const statusStyle = STATUS_COLORS[p.status] ?? { bg: '#F1F5F9', color: '#475569' }
          return (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '140px 1.5fr 140px 130px 130px 110px 110px', padding: '14px 20px', alignItems: 'center', borderTop: i === 0 ? 'none' : '1px solid #F5F0EB' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#8B1A1A' }}>{(p as any).paymentNumber ?? `PAY-${p.id}`}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1a2a4a' }}>{(p as any).customerName ?? `Invoice #${p.invoiceId}`}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{(p as any).invoiceNumber ?? (p as any).invoiceId ?? '—'}</div>
              <div><span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: modeStyle.bg, color: modeStyle.color, textTransform: 'uppercase' }}>{((p as any).paymentMode ?? p.mode ?? '—').replace('_', ' ')}</span></div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2a4a' }}>{formatINR(p.amount)}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{dayjs((p as any).paymentDate ?? (p as any).paidAt ?? p.createdAt).format('MMM DD, YYYY')}</div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: statusStyle.bg, color: statusStyle.color, textTransform: 'capitalize' }}>{(p as any).status ?? 'completed'}</span>
            </div>
          )
        })}

        </div></div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid #F5F0EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>{isLoading ? 'Loading...' : `Showing ${payments.length} of ${total} payments`}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button disabled={currentPage <= 1} onClick={() => setCurrentPage(currentPage - 1)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #E8E0D8', background: '#fff', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer', fontSize: 13, color: '#334155', opacity: currentPage <= 1 ? 0.4 : 1 }}>‹</button>
            <button disabled={payments.length < pageSize} onClick={() => setCurrentPage(currentPage + 1)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #E8E0D8', background: '#fff', cursor: payments.length < pageSize ? 'not-allowed' : 'pointer', fontSize: 13, color: '#334155', opacity: payments.length < pageSize ? 0.4 : 1 }}>›</button>
          </div>
        </div>
      </div>
    </div>
  )
}
