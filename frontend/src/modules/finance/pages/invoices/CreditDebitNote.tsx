import { useState } from 'react'
import { message, modal } from '@shared/lib/antdStatic'
import { PlusOutlined } from '@ant-design/icons'
import { Skeleton, Alert } from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoiceApi } from '../../api/invoiceApi'
import { formatINR } from '../../utils/currencyFormatter'
import dayjs from 'dayjs'

const TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  Credit: { bg: '#D1FAE5', color: '#065F46' },
  Debit:  { bg: '#FEE2E2', color: '#991B1B' },
}
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  issued:    { bg: '#FEF3C7', color: '#92400E' },
  applied:   { bg: '#D1FAE5', color: '#065F46' },
  cancelled: { bg: '#F1F5F9', color: '#94a3b8' },
}

function useCreditNotes() {
  return useQuery({
    queryKey: ['finance', 'credit-notes'],
    queryFn: () => invoiceApi.getCreditNotes({ page: 1, limit: 20 }).then((r) => r.data.data),
  })
}

function useDebitNotes() {
  return useQuery({
    queryKey: ['finance', 'debit-notes'],
    queryFn: () => invoiceApi.getDebitNotes({ page: 1, limit: 20 }).then((r) => r.data.data),
  })
}

function useCreateCreditNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Parameters<typeof invoiceApi.createCreditNote>[0]) =>
      invoiceApi.createCreditNote(payload).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance', 'credit-notes'] }) },
  })
}

function useCreateDebitNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Parameters<typeof invoiceApi.createDebitNote>[0]) =>
      invoiceApi.createDebitNote(payload).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance', 'debit-notes'] }) },
  })
}

export default function CreditDebitNote() {
  const [showForm, setShowForm] = useState(false)
  const [noteType, setNoteType] = useState<'Credit' | 'Debit'>('Credit')
  const [formData, setFormData] = useState({ refInvoice: '', clientName: '', amount: '', reason: '' })

  const { data: creditPage, isLoading: creditLoading, isError: creditError } = useCreditNotes()
  const { data: debitPage,  isLoading: debitLoading,  isError: debitError  } = useDebitNotes()
  const createCredit = useCreateCreditNote()
  const createDebit  = useCreateDebitNote()

  const creditNotes = creditPage?.data ?? []
  const debitNotes  = debitPage?.data ?? []

  const amountOf = (n: any) => Number(n.grandTotal ?? n.amount ?? 0)
  const creditTotal = creditNotes.reduce((s, n) => s + amountOf(n), 0)
  const debitTotal  = debitNotes.reduce((s, n) => s + amountOf(n), 0)

  const handleCreate = () => {
    if (!formData.refInvoice || !formData.amount) {
      message.warning('Reference invoice and amount are required')
      return
    }
    modal.confirm({
      title: `Create ${noteType} Note`,
      content: `Create a ${noteType.toLowerCase()} note of ${formatINR(Number(formData.amount))}?`,
      okText: 'Create',
      okButtonProps: { style: { background: '#8B1A1A', borderColor: '#8B1A1A' } },
      onOk: async () => {
        try {
          const base = {
            originalInvoiceId: formData.refInvoice,
            originalInvoiceNumber: formData.refInvoice,
            reason: formData.reason,
            lineItems: [],
            totalAmount: Number(formData.amount),
            gstAmount: 0,
            grandTotal: Number(formData.amount),
            date: dayjs().toISOString(),
          }
          if (noteType === 'Credit') {
            await createCredit.mutateAsync({ ...base, customerId: '', customerName: formData.clientName })
          } else {
            await createDebit.mutateAsync({ ...base, vendorId: '', vendorName: formData.clientName })
          }
          message.success(`${noteType} note created`)
          setShowForm(false)
          setFormData({ refInvoice: '', clientName: '', amount: '', reason: '' })
        } catch {
          message.error(`Failed to create ${noteType.toLowerCase()} note`)
        }
      },
    })
  }

  const isLoading = creditLoading || debitLoading

  type NoteRow = { id: string; noteNumber: string; type: 'Credit' | 'Debit'; refNumber: string; clientOrVendor: string; reason: string; grandTotal: number; date: string; status: string }

  const allNotes: NoteRow[] = [
    ...creditNotes.map((n: any) => ({ id: String(n.id), noteNumber: n.creditNoteNumber ?? `CN-${n.id}`, type: 'Credit' as const, refNumber: n.originalInvoiceNumber ?? `#${n.invoiceId ?? ''}`, clientOrVendor: n.customerName ?? '—', reason: n.reason ?? '', grandTotal: amountOf(n), date: n.date ?? n.createdAt, status: n.status ?? 'issued' })),
    ...debitNotes.map((n: any)  => ({ id: String(n.id), noteNumber: n.debitNoteNumber ?? `DN-${n.id}`,  type: 'Debit'  as const, refNumber: n.originalInvoiceNumber ?? `#${n.invoiceId ?? ''}`, clientOrVendor: n.vendorName ?? '—',   reason: n.reason ?? '', grandTotal: amountOf(n), date: n.date ?? n.createdAt, status: n.status ?? 'issued' })),
  ].sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1a2a4a' }}>Credit / Debit Notes</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>Manage invoice adjustments and reversals</div>
        </div>
        <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: '#8B1A1A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <PlusOutlined /> New Note
        </button>
      </div>

      {(creditError || debitError) && <Alert type="error" message="Failed to load notes." style={{ marginBottom: 16 }} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, marginBottom: 20 }}>
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: '16px 18px' }}><Skeleton active paragraph={{ rows: 2 }} title={false} /></div>)
          : [
              { label: 'Total Credit Notes', value: formatINR(creditTotal), count: `${creditNotes.length} note${creditNotes.length !== 1 ? 's' : ''}`, color: '#059669' },
              { label: 'Total Debit Notes',  value: formatINR(debitTotal),  count: `${debitNotes.length} note${debitNotes.length !== 1 ? 's' : ''}`,  color: '#DC2626' },
              { label: 'Net Adjustment',     value: formatINR(Math.abs(creditTotal - debitTotal)), count: creditTotal >= debitTotal ? 'Credit' : 'Debit', color: '#8B1A1A' },
            ].map((k) => (
              <div key={k.label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: '16px 18px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', marginBottom: 6 }}>{k.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{k.count}</div>
              </div>
            ))
        }
      </div>

      {showForm && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a', marginBottom: 16 }}>Create New Note</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {(['Credit', 'Debit'] as const).map((t) => (
              <button key={t} onClick={() => setNoteType(t)} style={{ padding: '7px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: noteType === t ? (t === 'Credit' ? '#D1FAE5' : '#FEE2E2') : '#F5F0EB', color: noteType === t ? (t === 'Credit' ? '#065F46' : '#991B1B') : '#64748b' }}>
                {t} Note
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
            {[
              { field: 'refInvoice' as const,  label: 'Reference Invoice' },
              { field: 'clientName' as const,  label: noteType === 'Credit' ? 'Client Name' : 'Vendor Name' },
              { field: 'amount' as const,       label: 'Amount (₹)' },
            ].map(({ field, label }) => (
              <div key={field}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>{label}</label>
                <input value={formData[field]} onChange={(e) => setFormData((p) => ({ ...p, [field]: e.target.value }))} placeholder={label} style={{ width: '100%', padding: '8px 12px', border: '1px solid #E8E0D8', borderRadius: 8, fontSize: 13, color: '#334155', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Reason</label>
            <textarea value={formData.reason} onChange={(e) => setFormData((p) => ({ ...p, reason: e.target.value }))} placeholder="Reason for adjustment..." rows={2} style={{ width: '100%', padding: '8px 12px', border: '1px solid #E8E0D8', borderRadius: 8, fontSize: 13, color: '#334155', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E8E0D8', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#334155' }}>Cancel</button>
            <button onClick={handleCreate} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#8B1A1A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Create {noteType} Note</button>
          </div>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '130px 80px 110px 1.5fr 1.5fr 110px 100px 90px', padding: '8px 20px', background: '#1a2a4a' }}>
          {['NOTE ID', 'TYPE', 'REF INV', 'CLIENT/VENDOR', 'REASON', 'AMOUNT', 'DATE', 'STATUS'].map((h) => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px' }}>{h}</div>
          ))}
        </div>

        {isLoading && <div style={{ padding: 20 }}><Skeleton active paragraph={{ rows: 4 }} /></div>}
        {!isLoading && allNotes.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', fontSize: 14, color: '#94a3b8' }}>No notes found</div>
        )}
        {!isLoading && allNotes.map((n, i) => {
          const typeStyle   = TYPE_STYLE[n.type]
          const statusStyle = STATUS_STYLE[n.status] ?? STATUS_STYLE['issued']
          return (
            <div key={n.id} style={{ display: 'grid', gridTemplateColumns: '130px 80px 110px 1.5fr 1.5fr 110px 100px 90px', padding: '14px 20px', alignItems: 'center', borderTop: i === 0 ? 'none' : '1px solid #F5F0EB' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#8B1A1A' }}>{n.noteNumber}</div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: typeStyle.bg, color: typeStyle.color, width: 'fit-content' }}>{n.type}</span>
              <div style={{ fontSize: 12, color: '#64748b' }}>{n.refNumber}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2a4a' }}>{n.clientOrVendor}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{n.reason}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2a4a' }}>{formatINR(n.grandTotal)}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{dayjs(n.date).format('MMM DD, YYYY')}</div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: statusStyle.bg, color: statusStyle.color, textTransform: 'capitalize' }}>{n.status}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
