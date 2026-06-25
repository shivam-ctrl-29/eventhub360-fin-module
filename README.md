# EventHub 360 — Module 12: Finance & Accounting

Full-stack implementation of the Finance & Accounting module for EventHub 360 ERP.

## Structure

```
├── frontend/   React 19 + TypeScript + Vite + Ant Design
└── backend/    NestJS + TypeORM + PostgreSQL 15
```

## Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5174
```

## Backend

```bash
cd backend
npm install
npm run start:dev
# Runs on http://localhost:3001
```

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Ant Design, React Query, Recharts, React Router v6
- **Backend:** NestJS, TypeORM, PostgreSQL 15
- **Database:** eventhub_local (local dev) / eventhub_demo (shared)

## Module 12 — Finance & Accounting (18 Screens)

| Section | Screens |
|---|---|
| Dashboards | CFO Dashboard, AR/AP Aging, Cash Flow |
| Invoicing | Invoice List, Invoice Builder, Invoice Detail, Credit/Debit Notes |
| Payments | Payment List, Reconciliation Desk, Receipt View |
| Receivables | AR Aging Report, Dunning Management |
| Payables | Vendor Bill List, Payout Schedule |
| Expenses | Expense Approval |
| Reports | GST/TDS Report, P&L Report, Audit Trail |

## Developer

**Shivam Mathur** — Frontend & Backend, Module 12 Finance & Accounting
