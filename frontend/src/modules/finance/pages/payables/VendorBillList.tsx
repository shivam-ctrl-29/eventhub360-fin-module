import { useState, useRef } from 'react'
import {
  SearchOutlined, CloudUploadOutlined, CheckCircleFilled,
  FileTextOutlined, StarFilled,
} from '@ant-design/icons'
import { Skeleton, message, Modal, Form, Input, InputNumber, Select, DatePicker } from 'antd'
import { useVendorBills, useApprovePayouts, useUploadBill } from '../../hooks/useAPDashboard'
import { formatINR } from '../../utils/currencyFormatter'
import { downloadCSV } from '../../utils/exportHelper'
import dayjs from 'dayjs'

const ALLOWED = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
const MAX_BYTES = 5 * 1024 * 1024

const CATEGORY_OPTS = [
  { value: 'food_beverage', label: 'Food & Beverage' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'travel', label: 'Travel' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'venue', label: 'Venue' },
  { value: 'decor', label: 'Decor' },
  { value: 'miscellaneous', label: 'Miscellaneous' },
]

export default function VendorBillList() {
  const [selected, setSelected] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [localSearch, setLocalSearch] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form] = Form.useForm()

  const { data: page, isLoading } = useVendorBills({ page: 1, limit: 20, search: localSearch || undefined })
  const approveMutation = useApprovePayouts()
  const uploadMutation = useUploadBill()
  const bills = page?.data ?? []

  const validateFile = (file: File): boolean => {
    if (!ALLOWED.includes(file.type)) { message.error('Unsupported file type. Please upload a PDF, PNG, or JPG.'); return false }
    if (file.size > MAX_BYTES) { message.error('File too large. Maximum size is 5 MB.'); return false }
    return true
  }

  const onFilePicked = (file: File | undefined) => {
    if (!file) return
    if (!validateFile(file)) return
    setPendingFile(file)
    setFormOpen(true)
  }

  const submitUpload = async () => {
    try {
      const v = await form.validateFields()
      if (!pendingFile) { message.error('No file selected'); return }
      const fd = new FormData()
      fd.append('file', pendingFile)
      fd.append('vendorName', v.vendorName)
      fd.append('amount', String(v.amount))
      fd.append('gstAmount', String(v.gstAmount ?? 0))
      fd.append('category', v.category)
      if (v.dueDate) fd.append('dueDate', v.dueDate.format('YYYY-MM-DD'))
      await uploadMutation.mutateAsync(fd)
      message.success('Bill uploaded successfully')
      setFormOpen(false); setPendingFile(null); form.resetFields()
    } catch (e: any) {
      if (e?.errorFields) return
      message.error(e?.response?.data?.message ?? 'Upload failed')
    }
  }

  const toggleCheck = (id: string) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  const allChecked = bills.length > 0 && bills.every((b) => selected.includes(b.id))
  const toggleAll = () => { if (allChecked) setSelected([]); else setSelected(bills.map((b) => b.id)) }

  const handleApprove = () => {
    if (selected.length === 0) return
    Modal.confirm({
      title: 'Approve Bills',
      content: `Approve ${selected.length} selected bill(s) for payment?`,
      okText: 'Approve',
      okButtonProps: { style: { background: '#8B1A1A', borderColor: '#8B1A1A' } },
      onOk: async () => {
        try {
          await approveMutation.mutateAsync(selected)
          message.success(`${selected.length} bill(s) approved`)
          setSelected([])
        } catch {
          message.error('Approval failed')
        }
      },
    })
  }

  const totalPayable = bills.reduce((s, b) => s + b.totalAmount, 0)
  const dueToday = bills.filter((b) => dayjs(b.dueDate).isSame(dayjs(), 'day')).reduce((s, b) => s + b.totalAmount, 0)

  const exportQueue = () => {
    if (bills.length === 0) { message.info('No bills to export'); return }
    downloadCSV('vendor-bills', bills.map((b) => ({ id: b.id, vendor: (b as any).vendorName ?? '', amount: b.totalAmount, dueDate: (b as any).dueDate ?? '' })))
    message.success(`Exported ${bills.length} bills`)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1a2a4a' }}>Accounts Payable</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #E8E0D8', borderRadius: 10, padding: '8px 14px', width: 280 }}>
          <SearchOutlined style={{ color: '#94a3b8', fontSize: 14 }} />
          <input value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder="Search bills or vendors..." style={{ border: 'none', outline: 'none', fontSize: 13, color: '#334155', background: 'transparent', width: '100%' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: '20px 24px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Total Payable</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#1a2a4a' }}>{isLoading ? '—' : formatINR(totalPayable, { compact: true })}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: '20px 24px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Due Today</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#1a2a4a' }}>{isLoading ? '—' : formatINR(dueToday, { compact: true })}</div>
        </div>
      </div>

      {/* ── Middle Section: Upload + Payout Queue ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, marginBottom: 20 }}>

        {/* Upload Bill */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a', marginBottom: 14 }}>Upload Bill</div>

          {/* Hidden real file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            style={{ display: 'none' }}
            onChange={(e) => { onFilePicked(e.target.files?.[0]); e.target.value = '' }}
          />

          {/* Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); onFilePicked(e.dataTransfer.files?.[0]) }}
            style={{
              border: `2px dashed ${dragOver ? '#8B1A1A' : '#E2C4C4'}`,
              borderRadius: 10,
              padding: '28px 16px',
              textAlign: 'center',
              background: dragOver ? 'rgba(139,26,26,0.03)' : '#FDF9F7',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: 14,
            }}
          >
            <CloudUploadOutlined style={{ fontSize: 28, color: '#C4A24D', display: 'block', marginBottom: 10 }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              Click or drag a file to upload
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
              PDF, PNG or JPG · up to 5 MB
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ width: '100%', padding: '9px 0', borderRadius: 8, border: 'none', background: '#8B1A1A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Select Bill File
          </button>
        </div>

        {/* Vendor Payout Queue */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 10px' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a' }}>Vendor Payout Queue</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Manage and approve outbound vendor payments</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 120px 140px', padding: '8px 20px', background: '#1a2a4a' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ cursor: 'pointer', accentColor: '#8B1A1A' }} />
            </div>
            {['VENDOR & INVOICE', 'AMOUNT', 'DUE DATE'].map((h) => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px' }}>{h}</div>
            ))}
          </div>

          {isLoading && <div style={{ padding: 20 }}><Skeleton active paragraph={{ rows: 4 }} /></div>}
          {!isLoading && bills.length === 0 && <div style={{ padding: '32px', textAlign: 'center', fontSize: 14, color: '#94a3b8' }}>No vendor bills found</div>}

          {!isLoading && bills.map((b, i) => {
            const isOverdue = dayjs(b.dueDate).isBefore(dayjs(), 'day')
            const isDueToday = dayjs(b.dueDate).isSame(dayjs(), 'day')
            const dueLabel = isOverdue ? 'Overdue' : isDueToday ? 'Today' : `In ${dayjs(b.dueDate).diff(dayjs(), 'day')} days`
            const dueLabelColor = isOverdue || isDueToday ? '#DC2626' : '#C4A24D'
            return (
              <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 120px 140px', padding: '16px 20px', alignItems: 'center', borderTop: i === 0 ? 'none' : '1px solid #F5F0EB', background: selected.includes(b.id) ? 'rgba(139,26,26,0.03)' : '#fff' }}>
                <input type="checkbox" checked={selected.includes(b.id)} onChange={() => toggleCheck(b.id)} style={{ cursor: 'pointer', accentColor: '#8B1A1A' }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2a4a' }}>{b.vendorName}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>{b.billNumber} • {b.category}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2a4a' }}>{formatINR(b.totalAmount)}</div>
                <div>
                  <div style={{ fontSize: 13, color: '#334155' }}>{dayjs(b.dueDate).format('MMM DD, YYYY')}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: dueLabelColor, marginTop: 2 }}>{dueLabel}</div>
                </div>
              </div>
            )
          })}

          <div style={{ padding: '14px 20px', borderTop: '1px solid #F5F0EB', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={exportQueue} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #E8E0D8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Export Queue</button>
            <button onClick={handleApprove} disabled={selected.length === 0} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: selected.length === 0 ? '#cbd5e1' : '#8B1A1A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: selected.length === 0 ? 'not-allowed' : 'pointer' }}>Approve Selected ({selected.length})</button>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a', marginBottom: 16 }}>Vendor Health</div>
        {bills.slice(0, 3).map((b) => (
          <div key={b.id} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <StarFilled style={{ color: '#C4A24D', fontSize: 14 }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: '#334155' }}>{b.vendorName}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: b.status === 'paid' ? '#059669' : '#C4A24D', textTransform: 'capitalize' }}>{b.status}</span>
            </div>
            <div style={{ height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: b.status === 'paid' ? '100%' : '60%', background: '#8B1A1A', borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Upload Bill — details modal (file already selected & validated) */}
      <Modal
        title="Upload Vendor Bill"
        open={formOpen}
        onCancel={() => { setFormOpen(false); setPendingFile(null); form.resetFields() }}
        onOk={submitUpload}
        okText="Upload Bill"
        confirmLoading={uploadMutation.isPending}
        okButtonProps={{ style: { background: '#8B1A1A', borderColor: '#8B1A1A' } }}
      >
        {pendingFile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FDF9F7', border: '1px solid #E8E0D8', borderRadius: 8, padding: '10px 12px', marginBottom: 16 }}>
            <FileTextOutlined style={{ color: '#8B1A1A', fontSize: 16 }} />
            <span style={{ fontSize: 13, fontWeight: 500, color: '#334155', flex: 1 }}>{pendingFile.name}</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{(pendingFile.size / 1024).toFixed(0)} KB</span>
            <CheckCircleFilled style={{ color: '#059669', fontSize: 14 }} />
          </div>
        )}
        <Form form={form} layout="vertical" initialValues={{ category: 'miscellaneous', gstAmount: 0 }}>
          <Form.Item name="vendorName" label="Vendor Name" rules={[{ required: true, message: 'Vendor name is required' }]}>
            <Input placeholder="e.g. Sound & Stage Co." />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="amount" label="Amount (₹)" rules={[{ required: true, message: 'Amount is required' }]}>
              <InputNumber min={1} style={{ width: '100%' }} placeholder="80000" />
            </Form.Item>
            <Form.Item name="gstAmount" label="GST Amount (₹)">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="14400" />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="category" label="Category" rules={[{ required: true }]}>
              <Select options={CATEGORY_OPTS} />
            </Form.Item>
            <Form.Item name="dueDate" label="Due Date">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
