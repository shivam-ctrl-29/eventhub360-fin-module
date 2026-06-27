import { useState } from 'react'
import { useDebounce } from '@shared/hooks/useDebounce'
import { SearchOutlined, BellOutlined, FilterOutlined } from '@ant-design/icons'
import { Skeleton, message, Modal, Form, Input, InputNumber, Select, DatePicker } from 'antd'
import { useExpenseList, useApproveExpense, useRejectExpense, useCreateExpense } from '../../hooks/useExpenses'
import { usePermissions } from '@shared/hooks/usePermissions'
import { formatINR } from '../../utils/currencyFormatter'
import dayjs from 'dayjs'

const CATEGORY_DISPLAY: Record<string, { label: string; icon: string; color: string; bar: string }> = {
  food_beverage: { label: 'F&B',       icon: '🍽️', color: '#FEE2E2', bar: '#8B1A1A' },
  logistics:     { label: 'Logistics', icon: '🚛', color: '#FEF3C7', bar: '#C4A24D' },
  travel:        { label: 'Travel',    icon: '✈️', color: '#F1F5F9', bar: '#94a3b8' },
  marketing:     { label: 'Marketing', icon: '📢', color: '#FEE2E2', bar: '#E06666' },
  venue:         { label: 'Venue',     icon: '🏛️', color: '#EDE9FE', bar: '#7C3AED' },
  decor:         { label: 'Decor',     icon: '🌸', color: '#D1FAE5', bar: '#059669' },
  miscellaneous: { label: 'Other',     icon: '📦', color: '#F1F5F9', bar: '#94a3b8' },
}

const POLICY_THRESHOLD = 5000

const STATUS_CYCLE: Array<string | undefined> = [undefined, 'pending', 'approved', 'rejected']

export default function ExpenseApproval() {
  const [localSearch, setLocalSearch] = useState('')
  const search = useDebounce(localSearch, 300)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [createOpen, setCreateOpen] = useState(false)
  const [form] = Form.useForm()

  const { data: page, isLoading } = useExpenseList({ page: 1, limit: 20, status: statusFilter })
  const { can } = usePermissions()
  const approveMutation = useApproveExpense()
  const rejectMutation  = useRejectExpense()
  const createMutation  = useCreateExpense()
  const expenses = page?.data ?? []

  const cycleFilter = () => {
    const idx = STATUS_CYCLE.indexOf(statusFilter)
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
    setStatusFilter(next)
    message.info(next ? `Filtering: ${next}` : 'Showing all expenses')
  }

  const submitCreate = async () => {
    try {
      const v = await form.validateFields()
      await createMutation.mutateAsync({
        category: v.category,
        description: v.description,
        amount: v.amount,
        submittedDate: (v.submittedDate ?? dayjs()).format('YYYY-MM-DD'),
      })
      message.success('Expense created')
      setCreateOpen(false)
      form.resetFields()
    } catch (e: any) {
      if (e?.errorFields) return
      message.error('Failed to create expense')
    }
  }

  const filtered = search
    ? expenses.filter((e) =>
        ((e as any).employeeName ?? e.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (e.description ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : expenses

  const handleApprove = (id: string, name: string) => {
    Modal.confirm({
      title: 'Approve Expense',
      content: `Approve expense claim by ${name}?`,
      okText: 'Approve',
      okButtonProps: { style: { background: '#8B1A1A', borderColor: '#8B1A1A' } },
      onOk: async () => {
        try {
          await approveMutation.mutateAsync(id)
          message.success('Expense approved')
        } catch {
          message.error('Failed to approve expense')
        }
      },
    })
  }

  const handleReject = (id: string, name: string) => {
    Modal.confirm({
      title: 'Reject Expense',
      content: `Reject expense claim by ${name}?`,
      okText: 'Reject',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await rejectMutation.mutateAsync({ id, reason: 'Out of policy' })
          message.success('Expense rejected')
        } catch {
          message.error('Failed to reject expense')
        }
      },
    })
  }

  const categoryTotals = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount
    return acc
  }, {})
  const maxCategoryTotal = Math.max(...Object.values(categoryTotals), 1)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#1a2a4a', lineHeight: 1.2 }}>Expense Management</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Real-time financial reconciliation & employee claims.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #E8E0D8', borderRadius: 10, padding: '8px 14px', width: 220 }}>
            <SearchOutlined style={{ color: '#94a3b8', fontSize: 13 }} />
            <input value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder="Search transactions..." style={{ border: 'none', outline: 'none', fontSize: 12, color: '#334155', background: 'transparent', width: '100%' }} />
          </div>
          <button onClick={() => setCreateOpen(true)} style={{ background: '#8B1A1A', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            + Quick Create
          </button>
          <div style={{ width: 34, height: 34, background: '#fff', border: '1px solid #E8E0D8', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <BellOutlined style={{ fontSize: 14, color: '#64748b' }} />
          </div>
        </div>
      </div>

      {/* Spending Distribution */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a', marginBottom: 16 }}>Spending Distribution</div>
        {isLoading
          ? <Skeleton active paragraph={{ rows: 2 }} />
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {Object.entries(categoryTotals).slice(0, 4).map(([cat, total]) => {
                const meta = CATEGORY_DISPLAY[cat] ?? { label: cat, icon: '📦', color: '#F1F5F9', bar: '#94a3b8' }
                const pct = Math.round((total / maxCategoryTotal) * 100)
                return (
                  <div key={cat} style={{ background: meta.color, borderRadius: 10, padding: '16px 14px' }}>
                    <div style={{ fontSize: 22, marginBottom: 10 }}>{meta.icon}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{meta.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1a2a4a', marginBottom: 10 }}>{formatINR(total, { compact: true })}</div>
                    <div style={{ height: 4, background: 'rgba(0,0,0,0.08)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: meta.bar, borderRadius: 2 }} />
                    </div>
                  </div>
                )
              })}
              {Object.keys(categoryTotals).length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '20px 0' }}>No spending data</div>
              )}
            </div>
          )
        }
      </div>

      {/* Employee Reimbursement Claims */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a4a' }}>Employee Reimbursement Claims</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Manage and approve multi-step claim workflows.</div>
          </div>
          <button onClick={cycleFilter} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #E8E0D8', background: statusFilter ? '#FBEAEA' : '#fff', fontSize: 12, color: statusFilter ? '#8B1A1A' : '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, textTransform: 'capitalize' }}>
            <FilterOutlined style={{ fontSize: 11 }} /> {statusFilter ?? 'Filter'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 120px 160px 140px', padding: '8px 20px', background: '#1a2a4a' }}>
          {['EMPLOYEE', 'DESCRIPTION', 'AMOUNT', 'POLICY STATUS', 'ACTIONS'].map((h) => (
            <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px' }}>{h}</div>
          ))}
        </div>

        {isLoading && <div style={{ padding: 20 }}><Skeleton active paragraph={{ rows: 5 }} /></div>}
        {!isLoading && filtered.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>No expense claims found</div>
        )}

        {!isLoading && filtered.map((e, i) => {
          const isCompliant = e.amount <= POLICY_THRESHOLD
          const empName = (e as any).employeeName ?? e.category ?? 'EX'
          const initials = empName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
          return (
            <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 120px 160px 140px', padding: '16px 20px', alignItems: 'center', borderTop: i === 0 ? 'none' : '1px solid #F5F0EB' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#8B1A1A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2a4a' }}>{empName}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' }}>{e.category.replace('_', ' ')}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#334155', paddingRight: 12 }}>{e.description}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2a4a' }}>{formatINR(e.amount)}</div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: isCompliant ? '#D1FAE5' : '#FEE2E2', color: isCompliant ? '#065F46' : '#991B1B', width: 'fit-content' }}>
                {isCompliant ? '✓ COMPLIANT' : '✗ OUT OF POLICY'}
              </span>
              {e.status === 'pending' && can('expense.approve') && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => handleApprove(e.id, empName)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: '#8B1A1A', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                  <button onClick={() => handleReject(e.id, empName)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #E8E0D8', background: '#fff', color: '#DC2626', fontSize: 11, cursor: 'pointer' }}>Reject</button>
                </div>
              )}
              {e.status !== 'pending' && (
                <span style={{ fontSize: 11, fontWeight: 700, color: e.status === 'approved' ? '#059669' : '#DC2626', textTransform: 'capitalize' }}>{e.status}</span>
              )}
            </div>
          )
        })}
      </div>

      <Modal
        title="New Expense Claim"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={submitCreate}
        okText="Create Expense"
        confirmLoading={createMutation.isPending}
        okButtonProps={{ style: { background: '#8B1A1A', borderColor: '#8B1A1A' } }}
      >
        <Form form={form} layout="vertical" initialValues={{ category: 'venue', submittedDate: dayjs() }}>
          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Select options={[
              { value: 'food_beverage', label: 'Food & Beverage' },
              { value: 'logistics', label: 'Logistics' },
              { value: 'travel', label: 'Travel' },
              { value: 'marketing', label: 'Marketing' },
              { value: 'venue', label: 'Venue' },
              { value: 'decor', label: 'Decor' },
              { value: 'miscellaneous', label: 'Miscellaneous' },
            ]} />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true, message: 'Please enter a description' }]}>
            <Input placeholder="e.g. Conference hall booking" />
          </Form.Item>
          <Form.Item name="amount" label="Amount (₹)" rules={[{ required: true, message: 'Please enter an amount' }]}>
            <InputNumber min={1} style={{ width: '100%' }} placeholder="25000" />
          </Form.Item>
          <Form.Item name="submittedDate" label="Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
