# EventHub 360 — Finance Module (Module 12)

Frontend for the Finance & Accounting module of EventHub 360, an enterprise event management platform.

---

## Module Overview

Module 12 covers end-to-end finance operations: invoicing, payments, expense management, vendor payables, receivables, GST/TDS compliance, and financial reporting.

---

## Features

| Screen | Route | Description |
|---|---|---|
| Finance Dashboard | `/finance` | KPIs, cash-flow heatmap, revenue charts |
| Invoice List | `/finance/invoices` | GST-compliant invoice register with sort/filter |
| Invoice Builder | `/finance/invoices/new` | Multi-line invoice creation with tax calculation |
| Invoice Detail | `/finance/invoices/:id` | View / send / download invoice |
| Credit & Debit Notes | `/finance/credit-debit-notes` | Issue CN/DN against invoices |
| Payment Recording | `/finance/payments` | Record and track payments |
| Reconciliation Desk | `/finance/reconciliation` | Match bank entries to invoices |
| Expense Approval | `/finance/expenses` | Employee claims approval workflow |
| Payout Schedule | `/finance/payouts` | Vendor payout calendar |
| AR Aging Report | `/finance/ar-aging` | Accounts receivable aging buckets |
| Dunning Management | `/finance/dunning` | Automated follow-up campaigns |
| Cash Flow Dashboard | `/finance/cash-flow` | Liquidity metrics and weekly forecast |
| AR/AP Aging Dashboard | `/finance/arap-aging` | Combined AR/AP aging summary |
| Profit & Loss Report | `/finance/pnl` | Event-level P&L with category breakdown |
| GST / TDS Report | `/finance/gst-tds` | GSTR filing status, ITC reconciliation, HSN breakdown |
| Audit Trail | `/finance/audit-trail` | Immutable activity log (auditor-gated) |

---

## Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **Ant Design 5** — UI components
- **React Query (@tanstack/react-query)** — all server state / API calls
- **Zustand** — UI-only state (modals, filters, pagination)
- **react-hook-form** + **Zod** — form validation
- **Axios** — HTTP client
- **Recharts** — charts
- **dayjs** — date formatting

---

## API Endpoints Used

All requests go through `axiosInstance` which attaches the JWT from `localStorage['auth_token']`.

| Resource | Base path |
|---|---|
| Invoices | `/api/fin/invoices` |
| Payments | `/api/fin/payments` |
| Expenses | `/api/fin/expenses` |
| Reconciliation | `/api/fin/reconciliation` |
| AR Aging | `/api/fin/ar-aging` |
| Cash Health | `/api/fin/cash-health` |
| P&L | `/api/fin/pnl/:eventId` |
| GST Summaries | `/api/fin/gst/summaries` |
| HSN Breakdown | `/api/fin/gst/hsn` |
| Audit Trail | `/api/fin/audit-trail` |

---

## Database

| Detail | Value |
|---|---|
| Host | 135.235.157.63 |
| Port | 5432 |
| Database | eventhub_demo |
| App user | eventhub_dev (read-only via app) |

Key tables: `fin_invoices`, `fin_payments`, `fin_expenses`, `fin_reconciliation`, `fin_gst_summaries`, `fin_audit_trail`, `fin_pnl_line_items`

Table creation requires postgres superuser access via pgAdmin (handled by supervisor).

---

## Environment Variables

```env
VITE_API_BASE_URL=http://135.235.157.63:3000
```

---

## Setup

```bash
npm install
npm run dev        # dev server on http://localhost:5173
npm run build      # production build
npm run lint       # ESLint v9 flat config
npx tsc --noEmit   # type check
```

---

## Auth & RBAC

JWT stored as `auth_token` in localStorage, decoded with `atob()`. Role-based access via `usePermissions()` hook.

Roles: `super_admin`, `finance_manager`, `accountant`, `auditor`

Key permission gates:
- `invoice.create` — New Invoice button
- `payment.create` — Record Payment button
- `expense.approve` — Approve/Reject buttons in Expense Approval
- `audit.view` — entire Audit Trail page

---

## Known Issues

- `InvoiceBuilder` form uses native inputs; react-hook-form + Zod validation is pending
- PaymentList sort params not yet wired (InvoiceList is complete)
- Responsive layout uses CSS `auto-fill/minmax` grid; table headers with fixed column tracks are not yet mobile-adapted

---

## Future Enhancements

- PDF export for invoices and P&L
- Bulk expense approve / reject
- Email dunning automation
- Multi-currency support
- Role-level audit log export
