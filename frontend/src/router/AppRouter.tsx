import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '../shared/components/AppLayout'
import { useAuth } from '../shared/hooks/useAuth'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    // Seed a dev token so the app is navigable before the login page is built
    if (import.meta.env.DEV) {
      const h = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      const p = btoa(JSON.stringify({ sub: '1', id: '1', name: 'Shivam Mathur', email: 'admin@demo.in', role: 'admin' }))
      localStorage.setItem('auth_token', `${h}.${p}.dev-sig`)
      window.location.reload()
      return null
    }
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

// Dashboard
import FinanceDashboard from '../modules/finance/pages/dashboard/FinanceDashboard'
import ARAPAgingDashboard from '../modules/finance/pages/dashboard/ARAPAgingDashboard'
import CashFlowDashboard from '../modules/finance/pages/dashboard/CashFlowDashboard'

// Invoices
import InvoiceList from '../modules/finance/pages/invoices/InvoiceList'
import InvoiceBuilder from '../modules/finance/pages/invoices/InvoiceBuilder'
import InvoiceDetail from '../modules/finance/pages/invoices/InvoiceDetail'
import CreditDebitNote from '../modules/finance/pages/invoices/CreditDebitNote'

// Payments
import PaymentList from '../modules/finance/pages/payments/PaymentList'
import ReconciliationDesk from '../modules/finance/pages/payments/ReconciliationDesk'
import ReceiptView from '../modules/finance/pages/payments/ReceiptView'

// Receivables
import ARAgingReport from '../modules/finance/pages/receivables/ARAgingReport'
import DunningManagement from '../modules/finance/pages/receivables/DunningManagement'

// Payables
import VendorBillList from '../modules/finance/pages/payables/VendorBillList'
import PayoutSchedule from '../modules/finance/pages/payables/PayoutSchedule'

// Expenses
import ExpenseApproval from '../modules/finance/pages/expenses/ExpenseApproval'

// Reports
import GSTTDSReport from '../modules/finance/pages/reports/GSTTDSReport'
import ProfitLossReport from '../modules/finance/pages/reports/ProfitLossReport'
import AuditTrail from '../modules/finance/pages/reports/AuditTrail'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<Navigate to="/finance/dashboard" replace />} />

        {/* Dashboards */}
        <Route path="finance/dashboard" element={<FinanceDashboard />} />
        <Route path="finance/ar-ap-aging" element={<ARAPAgingDashboard />} />
        <Route path="finance/cash-flow" element={<CashFlowDashboard />} />

        {/* Invoices */}
        <Route path="finance/invoices" element={<InvoiceList />} />
        <Route path="finance/invoices/new" element={<InvoiceBuilder />} />
        <Route path="finance/invoices/:id" element={<InvoiceDetail />} />
        <Route path="finance/invoices/:id/edit" element={<InvoiceBuilder />} />
        <Route path="finance/credit-debit-notes" element={<CreditDebitNote />} />

        {/* Payments */}
        <Route path="finance/payments" element={<PaymentList />} />
        <Route path="finance/reconciliation" element={<ReconciliationDesk />} />
        <Route path="finance/receipts/:id" element={<ReceiptView />} />

        {/* Receivables */}
        <Route path="finance/ar-aging" element={<ARAgingReport />} />
        <Route path="finance/dunning" element={<DunningManagement />} />

        {/* Payables */}
        <Route path="finance/vendor-bills" element={<VendorBillList />} />
        <Route path="finance/payouts" element={<PayoutSchedule />} />

        {/* Expenses */}
        <Route path="finance/expenses" element={<ExpenseApproval />} />

        {/* Reports */}
        <Route path="finance/gst-tds" element={<GSTTDSReport />} />
        <Route path="finance/pnl" element={<ProfitLossReport />} />
        <Route path="finance/audit-trail" element={<AuditTrail />} />
      </Route>
    </Routes>
  )
}
