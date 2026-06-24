import { useState, useCallback, useEffect } from 'react'
import { SearchOutlined, PlusOutlined, DownloadOutlined, EyeOutlined, EditOutlined, MoreOutlined, FileTextOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { Skeleton, Alert } from 'antd'
import { useInvoiceList } from '../../hooks/useInvoices'
import { useInvoiceStore } from '../../store/invoiceStore'
import { useDebounce } from '@shared/hooks/useDebounce'
import { usePermissions } from '@shared/hooks/usePermissions'
import type { InvoiceStatus } from '../../types/invoice.types'
import { formatINR } from '../../utils/currencyFormatter'
import dayjs from 'dayjs'

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  overdue:    { bg: '#FEE2E2', color: '#991B1B' },
  pending:    { bg: '#FEF3C7', color: '#92400E' },
  sent:       { bg: '#FEF3C7', color: '#92400E' },
  paid:       { bg: '#D1FAE5', color: '#065F46' },
  draft:      { bg: '#F1F5F9', color: '#475569' },
  partial:    { bg: '#EDE9FE', color: '#5B21B6' },
  cancelled:  { bg: '#F1F5F9', color: '#94a3b8' },
}

const FILTERS: Array<{ label: string; value: InvoiceStatus | 'all' }> = [
  { label: 'All',       value: 'all' },
  { label: 'Paid',      value: 'paid' },
  { label: 'Pending',   value: 'sent' },
  { label: 'Overdue',   value: 'overdue' },
  { label: 'Draft',     value: 'draft' },
]

export default function InvoiceList() {
  const navigate = useNavigate()
  const { can } = usePermissions()
  const { statusFilter, searchQuery, currentPage, pageSize, setStatusFilter, setSearchQuery, setCurrentPage } = useInvoiceStore()
  const [localSearch, setLocalSearch] = useState(searchQuery)
  const debouncedSearch = useDebounce(localSearch, 300)
  const [sortBy, setSortBy] = useState<string | undefined>(undefined)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    setSearchQuery(debouncedSearch)
    setCurrentPage(1)
  }, [debouncedSearch, setSearchQuery, setCurrentPage])

  const { data, isLoading, isError } = useInvoiceList({
    page: currentPage,
    limit: pageSize,
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: debouncedSearch || undefined,
    sortBy,
    sortOrder,
  })

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(col)
      setSortOrder('desc')
    }
    setCurrentPage(1)
  }

  const invoices = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const handleSearch = useCallback((val: string) => {
    setLocalSearch(val)
  }, [])

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1a2a4a' }}>Invoice Register</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>Manage all GST-compliant invoices and proforma documents</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #E8E0D8', background: '#fff', fontSize: 12, color: '#334155', cursor: 'pointer' }}>
            <DownloadOutlined /> Export
          </button>
          {can('invoice.create') && (
            <button onClick={() => navigate('/finance/invoices/new')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: '#8B1A1A', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <PlusOutlined /> New Invoice
            </button>
          )}
        </div>
      </div>

      {/* Filters + Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', background: '#F5F0EB', borderRadius: 8, padding: 3 }}>
          {FILTERS.map((f) => (
            <button key={f.value} onClick={() => { setStatusFilter(f.value); setCurrentPage(1) }} style={{ padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: statusFilter === f.value ? '#fff' : 'transparent', color: statusFilter === f.value ? '#8B1A1A' : '#64748b', boxShadow: statusFilter === f.value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #E8E0D8', borderRadius: 8, padding: '7px 12px', width: 240 }}>
          <SearchOutlined style={{ color: '#94a3b8', fontSize: 13 }} />
          <input value={localSearch} onChange={(e) => handleSearch(e.target.value)} placeholder="Search invoices..." style={{ border: 'none', outline: 'none', fontSize: 12, background: 'transparent', width: '100%', color: '#334155' }} />
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <Alert type="error" message="Failed to load invoices. Please try again." style={{ marginBottom: 16 }} />
      )}

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E0D8', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: 780 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '140px 1.5fr 1.5fr 100px 100px 130px 100px 80px', padding: '8px 20px', background: '#1a2a4a' }}>
          {['INVOICE ID', 'CLIENT', 'EVENT', 'DATE', 'DUE DATE', 'AMOUNT', 'STATUS', 'ACTIONS'].map((h) => {
            const colKey = h === 'DATE' ? 'issueDate' : h === 'AMOUNT' ? 'grandTotal' : null
            const isActive = colKey && sortBy === colKey
            return (
              <div key={h} onClick={colKey ? () => handleSort(colKey) : undefined} style={{ fontSize: 10, fontWeight: 700, color: isActive ? '#fff' : '#94a3b8', letterSpacing: '0.5px', cursor: colKey ? 'pointer' : 'default', userSelect: 'none' }}>
                {h}{isActive ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : ''}
              </div>
            )
          })}
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} active paragraph={{ rows: 1 }} />)}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && invoices.length === 0 && (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <FileTextOutlined style={{ fontSize: 36, color: '#cbd5e1', marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>No invoices found</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Try changing the filters or create a new invoice</div>
          </div>
        )}

        {/* Rows */}
        {!isLoading && invoices.map((inv, i) => {
          const style = STATUS_STYLE[inv.status] ?? STATUS_STYLE['draft']
          return (
            <div key={inv.id} style={{ display: 'grid', gridTemplateColumns: '140px 1.5fr 1.5fr 100px 100px 130px 100px 80px', padding: '14px 20px', alignItems: 'center', borderTop: i === 0 ? 'none' : '1px solid #F5F0EB' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#8B1A1A' }}>{inv.invoiceNumber}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1a2a4a' }}>{inv.customer.name}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>—</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{dayjs(inv.issueDate).format('MMM DD, YYYY')}</div>
              <div style={{ fontSize: 11, color: inv.status === 'overdue' ? '#DC2626' : '#64748b', fontWeight: inv.status === 'overdue' ? 600 : 400 }}>{dayjs(inv.dueDate).format('MMM DD, YYYY')}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2a4a' }}>{formatINR(inv.grandTotal)}</div>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: style.bg, color: style.color, textTransform: 'capitalize' }}>
                  {inv.status}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                <button onClick={() => navigate(`/finance/invoices/${inv.id}`)} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #E8E0D8', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <EyeOutlined style={{ fontSize: 11, color: '#64748b' }} />
                </button>
                <button onClick={() => navigate(`/finance/invoices/${inv.id}/edit`)} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #E8E0D8', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <EditOutlined style={{ fontSize: 11, color: '#64748b' }} />
                </button>
                <button style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #E8E0D8', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MoreOutlined style={{ fontSize: 11, color: '#64748b' }} />
                </button>
              </div>
            </div>
          )
        })}

        </div></div>
        {/* Pagination footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #F5F0EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>
            {isLoading ? 'Loading...' : `Showing ${invoices.length} of ${total} invoices`}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button disabled={currentPage <= 1} onClick={() => setCurrentPage(currentPage - 1)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #E8E0D8', background: '#fff', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer', fontSize: 13, color: '#334155', opacity: currentPage <= 1 ? 0.4 : 1 }}>‹</button>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(currentPage + 1)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #E8E0D8', background: '#fff', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', fontSize: 13, color: '#334155', opacity: currentPage >= totalPages ? 0.4 : 1 }}>›</button>
          </div>
        </div>
      </div>
    </div>
  )
}
