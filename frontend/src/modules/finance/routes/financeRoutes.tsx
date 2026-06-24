import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const FinanceDashboard    = lazy(() => import('../pages/dashboard/FinanceDashboard'))
const ARAPAgingDashboard  = lazy(() => import('../pages/dashboard/ARAPAgingDashboard'))
const CashFlowDashboard   = lazy(() => import('../pages/dashboard/CashFlowDashboard'))
const InvoiceList         = lazy(() => import('../pages/invoices/InvoiceList'))
const InvoiceBuilder      = lazy(() => import('../pages/invoices/InvoiceBuilder'))
const InvoiceDetail       = lazy(() => import('../pages/invoices/InvoiceDetail'))
const CreditDebitNote     = lazy(() => import('../pages/invoices/CreditDebitNote'))
const PaymentList         = lazy(() => import('../pages/payments/PaymentList'))
const ReconciliationDesk  = lazy(() => import('../pages/payments/ReconciliationDesk'))
const ReceiptView         = lazy(() => import('../pages/payments/ReceiptView'))
const ARAgingReport       = lazy(() => import('../pages/receivables/ARAgingReport'))
const DunningManagement   = lazy(() => import('../pages/receivables/DunningManagement'))
const VendorBillList      = lazy(() => import('../pages/payables/VendorBillList'))
const PayoutSchedule      = lazy(() => import('../pages/payables/PayoutSchedule'))
const ExpenseApproval     = lazy(() => import('../pages/expenses/ExpenseApproval'))
const GSTTDSReport        = lazy(() => import('../pages/reports/GSTTDSReport'))
const ProfitLossReport    = lazy(() => import('../pages/reports/ProfitLossReport'))
const AuditTrail          = lazy(() => import('../pages/reports/AuditTrail'))

export const financeRoutes: RouteObject[] = [
  { path: 'dashboard',     element: <FinanceDashboard /> },
  { path: 'ar-ap-aging',  element: <ARAPAgingDashboard /> },
  { path: 'cash-flow',    element: <CashFlowDashboard /> },
  { path: 'invoices',     element: <InvoiceList /> },
  { path: 'invoices/new', element: <InvoiceBuilder /> },
  { path: 'invoices/:id', element: <InvoiceDetail /> },
  { path: 'invoices/:id/edit', element: <InvoiceBuilder /> },
  { path: 'credit-debit-notes', element: <CreditDebitNote /> },
  { path: 'payments',     element: <PaymentList /> },
  { path: 'reconciliation', element: <ReconciliationDesk /> },
  { path: 'receipts/:id', element: <ReceiptView /> },
  { path: 'ar-aging',     element: <ARAgingReport /> },
  { path: 'dunning',      element: <DunningManagement /> },
  { path: 'vendor-bills', element: <VendorBillList /> },
  { path: 'payouts',      element: <PayoutSchedule /> },
  { path: 'expenses',     element: <ExpenseApproval /> },
  { path: 'gst-tds',      element: <GSTTDSReport /> },
  { path: 'pnl',          element: <ProfitLossReport /> },
  { path: 'audit-trail',  element: <AuditTrail /> },
]
