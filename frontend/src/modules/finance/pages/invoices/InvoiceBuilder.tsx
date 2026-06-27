import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PlusOutlined, DeleteOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { useCreateInvoice } from '../../hooks/useInvoices'

const lineItemSchema = z.object({
  desc:  z.string().min(1, 'Description is required'),
  qty:   z.number({ invalid_type_error: 'Required' }).min(1, 'Min 1'),
  rate:  z.number({ invalid_type_error: 'Required' }).min(0, 'Min 0'),
  gst:   z.number(),
})

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  invoiceDate:   z.string().min(1, 'Invoice date is required'),
  dueDate:       z.string().min(1, 'Due date is required'),
  poNumber:      z.string().optional(),
  clientName:    z.string().min(1, 'Client name is required'),
  gstin:         z.string().optional(),
  address:       z.string().min(1, 'Address is required'),
  cityState:     z.string().min(1, 'City & State is required'),
  notes:         z.string().optional(),
  paymentMode:   z.enum(['bank_transfer', 'upi', 'cheque', 'cash', 'card']),
  items:         z.array(lineItemSchema).min(1, 'At least one line item is required'),
})

type InvoiceFormData = z.infer<typeof invoiceSchema>

const ERR: React.CSSProperties = { fontSize: 10, color: '#DC2626', marginTop: 3 }
const INPUT: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '1px solid #E8E0D8', borderRadius: 8, fontSize: 12, color: '#334155', outline: 'none', background: '#FAFAF9', boxSizing: 'border-box' }
const INPUT_ERR: React.CSSProperties = { ...INPUT, border: '1px solid #DC2626' }

export default function InvoiceBuilder() {
  const navigate = useNavigate()
  const createInvoice = useCreateInvoice()

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      paymentMode: 'bank_transfer',
      items: [
        { desc: '', qty: 1, rate: 0, gst: 18 },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')

  const subtotal = watchedItems?.reduce((s, i) => s + (i.qty || 0) * (i.rate || 0), 0) ?? 0
  const totalGst  = watchedItems?.reduce((s, i) => s + ((i.qty || 0) * (i.rate || 0) * (i.gst || 0)) / 100, 0) ?? 0
  const total     = subtotal + totalGst
  const fmt       = (n: number) => `₹${n.toLocaleString('en-IN')}`

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      await createInvoice.mutateAsync({
        invoiceNumber: data.invoiceNumber,
        issueDate:     data.invoiceDate,
        dueDate:       data.dueDate,
        poNumber:      data.poNumber,
        customer: { name: data.clientName, gstin: data.gstin, address: data.address, cityState: data.cityState },
        lineItems:    data.items.map((i) => ({ description: i.desc, quantity: i.qty, unitPrice: i.rate, gstRate: i.gst })),
        notes:        data.notes,
        paymentMode:  data.paymentMode,
      } as Parameters<typeof createInvoice.mutateAsync>[0])
      message.success('Invoice created successfully')
      navigate('/finance/invoices')
    } catch {
      message.error('Failed to create invoice. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1a2a4a' }}>Create Invoice</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>GST-compliant tax invoice with branded template</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={() => navigate('/finance/invoices')} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E8E0D8', background: '#fff', fontSize: 12, color: '#334155', cursor: 'pointer' }}>Cancel</button>
          <button type="submit" name="draft" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #E8E0D8', background: '#fff', fontSize: 12, color: '#334155', cursor: 'pointer' }}>
            <SaveOutlined /> Save Draft
          </button>
          <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#8B1A1A', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <SendOutlined /> Send Invoice
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <div>
          {/* Invoice Details */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2a4a', marginBottom: 14 }}>Invoice Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Invoice Number *</label>
                <input {...register('invoiceNumber')} placeholder="INV-..." style={errors.invoiceNumber ? INPUT_ERR : INPUT} />
                {errors.invoiceNumber && <div style={ERR}>{errors.invoiceNumber.message}</div>}
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Invoice Date *</label>
                <input type="date" {...register('invoiceDate')} style={errors.invoiceDate ? INPUT_ERR : INPUT} />
                {errors.invoiceDate && <div style={ERR}>{errors.invoiceDate.message}</div>}
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Due Date *</label>
                <input type="date" {...register('dueDate')} style={errors.dueDate ? INPUT_ERR : INPUT} />
                {errors.dueDate && <div style={ERR}>{errors.dueDate.message}</div>}
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>PO Number</label>
                <input {...register('poNumber')} placeholder="PO-..." style={INPUT} />
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2a4a', marginBottom: 14 }}>Bill To</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Client Name *</label>
                <input {...register('clientName')} placeholder="Client Name" style={errors.clientName ? INPUT_ERR : INPUT} />
                {errors.clientName && <div style={ERR}>{errors.clientName.message}</div>}
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>GSTIN</label>
                <input {...register('gstin')} placeholder="GSTIN" style={INPUT} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Address *</label>
                <input {...register('address')} placeholder="Address" style={errors.address ? INPUT_ERR : INPUT} />
                {errors.address && <div style={ERR}>{errors.address.message}</div>}
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>City & State *</label>
                <input {...register('cityState')} placeholder="City & State" style={errors.cityState ? INPUT_ERR : INPUT} />
                {errors.cityState && <div style={ERR}>{errors.cityState.message}</div>}
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '16px 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2a4a' }}>Line Items</div>
              <button type="button" onClick={() => append({ desc: '', qty: 1, rate: 0, gst: 18 })} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#8B1A1A', border: '1px dashed #8B1A1A', borderRadius: 6, padding: '4px 10px', background: 'transparent', cursor: 'pointer' }}>
                <PlusOutlined /> Add Item
              </button>
            </div>
            {errors.items?.root && <div style={{ ...ERR, padding: '0 20px 8px' }}>{errors.items.root.message}</div>}
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: 600 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 120px 80px 120px 32px', padding: '8px 20px', background: '#1a2a4a' }}>
                  {['DESCRIPTION', 'QTY', 'RATE (₹)', 'GST %', 'AMOUNT', ''].map((h) => (
                    <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px' }}>{h}</div>
                  ))}
                </div>
                {fields.map((field, index) => (
                  <div key={field.id} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 120px 80px 120px 32px', padding: '10px 20px', alignItems: 'flex-start', borderTop: '1px solid #F5F0EB', gap: 8 }}>
                    <div>
                      <input {...register(`items.${index}.desc`)} style={{ padding: '6px 10px', border: errors.items?.[index]?.desc ? '1px solid #DC2626' : '1px solid #E8E0D8', borderRadius: 6, fontSize: 12, color: '#334155', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                      {errors.items?.[index]?.desc && <div style={ERR}>{errors.items[index]?.desc?.message}</div>}
                    </div>
                    <div>
                      <Controller control={control} name={`items.${index}.qty`} render={({ field: f }) => (
                        <input type="number" value={f.value} onChange={(e) => f.onChange(+e.target.value)} style={{ padding: '6px 8px', border: errors.items?.[index]?.qty ? '1px solid #DC2626' : '1px solid #E8E0D8', borderRadius: 6, fontSize: 12, color: '#334155', outline: 'none', textAlign: 'center', width: '100%', boxSizing: 'border-box' }} />
                      )} />
                      {errors.items?.[index]?.qty && <div style={ERR}>{errors.items[index]?.qty?.message}</div>}
                    </div>
                    <div>
                      <Controller control={control} name={`items.${index}.rate`} render={({ field: f }) => (
                        <input type="number" value={f.value} onChange={(e) => f.onChange(+e.target.value)} style={{ padding: '6px 8px', border: errors.items?.[index]?.rate ? '1px solid #DC2626' : '1px solid #E8E0D8', borderRadius: 6, fontSize: 12, color: '#334155', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                      )} />
                      {errors.items?.[index]?.rate && <div style={ERR}>{errors.items[index]?.rate?.message}</div>}
                    </div>
                    <Controller control={control} name={`items.${index}.gst`} render={({ field: f }) => (
                      <select value={f.value} onChange={(e) => f.onChange(+e.target.value)} style={{ padding: '6px 8px', border: '1px solid #E8E0D8', borderRadius: 6, fontSize: 12, color: '#334155', outline: 'none', width: '100%' }}>
                        {[0, 5, 12, 18, 28].map((g) => <option key={g} value={g}>{g}%</option>)}
                      </select>
                    )} />
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1a2a4a', paddingTop: 8 }}>
                      {fmt((watchedItems?.[index]?.qty || 0) * (watchedItems?.[index]?.rate || 0))}
                    </div>
                    <button type="button" onClick={() => remove(index)} style={{ width: 26, height: 26, marginTop: 4, borderRadius: 6, border: '1px solid #FEE2E2', background: '#FFF5F5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <DeleteOutlined style={{ fontSize: 11, color: '#DC2626' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 8 }}>Notes / Terms</label>
            <textarea {...register('notes')} placeholder="Payment terms, bank details, notes..." rows={3} style={{ width: '100%', padding: '10px 12px', border: '1px solid #E8E0D8', borderRadius: 8, fontSize: 12, color: '#334155', outline: 'none', resize: 'vertical', background: '#FAFAF9', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Summary Panel */}
        <div>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20, position: 'sticky', top: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2a4a', marginBottom: 16 }}>Invoice Summary</div>
            {[
              { label: 'Subtotal', value: fmt(subtotal) },
              { label: 'GST',      value: fmt(totalGst)  },
            ].map((r) => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>{r.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{r.value}</span>
              </div>
            ))}
            <div style={{ borderTop: '2px solid #1a2a4a', paddingTop: 12, display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1a2a4a' }}>Total</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#8B1A1A' }}>{fmt(total)}</span>
            </div>
            <div style={{ background: '#F8F5F1', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>GST Breakdown</div>
              {[5, 18].map((rate) => {
                const taxable = watchedItems?.filter((i) => i.gst === rate).reduce((s, i) => s + (i.qty || 0) * (i.rate || 0), 0) ?? 0
                const tax = (taxable * rate) / 100
                return taxable > 0 ? (
                  <div key={rate} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 3 }}>
                    <span>GST @ {rate}%</span><span>{fmt(tax)}</span>
                  </div>
                ) : null
              })}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Payment Mode</label>
              <Controller control={control} name="paymentMode" render={({ field }) => (
                <select {...field} style={{ width: '100%', padding: '8px 12px', border: '1px solid #E8E0D8', borderRadius: 8, fontSize: 12, color: '#334155', outline: 'none' }}>
                  {[['bank_transfer', 'Bank Transfer'], ['upi', 'UPI'], ['cheque', 'Cheque'], ['cash', 'Cash'], ['card', 'Card']].map(([val, lbl]) => (
                    <option key={val} value={val}>{lbl}</option>
                  ))}
                </select>
              )} />
            </div>
            <button type="submit" disabled={createInvoice.isPending} style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', background: '#8B1A1A', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 8, opacity: createInvoice.isPending ? 0.7 : 1 }}>
              {createInvoice.isPending ? 'Sending...' : 'Send Invoice'}
            </button>
            <button type="button" onClick={() => { message.info('Use the print dialog and choose "Save as PDF"'); window.print() }} style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: '1px solid #E8E0D8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
