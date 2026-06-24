interface Column<T> {
  key: string
  title: string
  render?: (row: T) => React.ReactNode
  width?: number | string
  align?: 'left' | 'center' | 'right'
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  rowKey: keyof T | ((row: T) => string)
  loading?: boolean
  emptyText?: string
}

export default function DataTable<T>({ columns, data, rowKey, loading, emptyText = 'No data' }: DataTableProps<T>) {
  const getKey = (row: T): string =>
    typeof rowKey === 'function' ? rowKey(row) : String(row[rowKey])

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#F8F5F1', borderBottom: '1px solid #E8E0D8' }}>
            {columns.map((col) => (
              <th key={col.key} style={{
                padding: '10px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.6px', color: '#94a3b8', textAlign: col.align ?? 'left',
                width: col.width,
              }}>
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length} style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading...</td></tr>
          ) : data.length === 0 ? (
            <tr><td colSpan={columns.length} style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>{emptyText}</td></tr>
          ) : (
            data.map((row) => (
              <tr key={getKey(row)} style={{ borderBottom: '1px solid #F1EDE8' }}>
                {columns.map((col) => (
                  <td key={col.key} style={{ padding: '11px 14px', fontSize: 13, color: '#334155', textAlign: col.align ?? 'left' }}>
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
