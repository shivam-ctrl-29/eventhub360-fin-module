# Module 12 — Finance & Accounting · Viva Prep

A study guide for the oral test. Answers match the actual implementation.

---

## 0. 30-second elevator pitch
"I built the Finance & Accounting module of EventHub 360 — a full-stack ERP module covering
invoicing, payments, expenses, vendor payouts, GST reporting, and event-level P&L. It's a
React 19 + Ant Design frontend talking to a NestJS + TypeORM backend over REST, with all data
persisted in PostgreSQL. I did the database design, the backend APIs, and the frontend screens."

---

## 1. Tech stack (and why)

| Layer | Tech | Why |
|---|---|---|
| Frontend | React 19 + Vite | Fast dev server, modern hooks |
| UI | Ant Design | Ready-made enterprise components (tables, modals, forms) |
| Data fetching | React Query (TanStack) | Caching, auto-refetch, loading/error states |
| Charts | Recharts | Declarative charts for dashboards |
| Backend | NestJS + TypeScript | Structured, modular (controllers/services/DTOs) |
| ORM | TypeORM | Entity mapping, repositories, query builder |
| DB | PostgreSQL 15 | Relational, ACID, strong typing |
| Auth | JWT | Stateless token auth |

**Q: Why NestJS over plain Express?**
Built-in dependency injection, a clear module/controller/service structure, decorator-based
validation, and it scales well for a multi-team ERP.

---

## 2. Database (the most-asked topic)

**9 Finance tables:**
`invoice`, `invoice_line`, `payment`, `expense`, `payout`, `credit_note`, `pnl`, `tax_rule`, `fin_audit_trail`
Plus 4 shared foundation tables referenced by FKs: `tenant`, `company`, `branch`, `user_account`.

**Global conventions (every table follows these):**
- Primary key: `BIGSERIAL` named `<table>_id` (e.g. `invoice_id`)
- Money: `DECIMAL(14,2)` — never float (avoids rounding errors)
- Timestamps: `TIMESTAMPTZ` in UTC
- Standard columns on every row: `tenant_id`, `company_id`, `branch_id`, `created_at`,
  `updated_at`, `created_by`, `updated_by`, `is_active`
- Singular table names

**Key relationships:**
- `invoice` 1—many `invoice_line` (ON DELETE CASCADE)
- `invoice` 1—many `payment`
- `invoice` 1—many `credit_note`
- `invoice_line` many—1 `tax_rule`
- `pnl` has a generated column: `margin = revenue - direct_cost` (computed by the DB)

**Q: Why DECIMAL not FLOAT for money?**
Floats can't represent values like 0.1 exactly → rounding errors in financial totals.
DECIMAL(14,2) stores exact rupee-and-paise values.

**Q: What's the audit table for?**
`fin_audit_trail` logs every create/approve/payment action immutably (who, what, when, severity)
for compliance — it's append-only.

---

## 3. Multi-tenancy

"Shared-database, shared-schema." Every row carries `tenant_id` + `company_id`, so multiple
client companies share the same tables but their data is isolated by those columns. Cheaper and
simpler than a database-per-tenant model.

---

## 4. Architecture & data flow

**Request flow (e.g. creating an invoice):**
1. React form (Invoice Builder) validates input with Zod
2. React Query mutation → `POST /api/fin/invoices`
3. NestJS **controller** receives it, **DTO** validates the body (class-validator)
4. **Service** computes totals, builds the entity, saves via TypeORM **repository**
5. Row written to PostgreSQL; audit entry logged
6. Standard response returned; React Query refetches the invoice list

**Folder structure (backend):** `controllers/`, `services/`, `entities/`, `dto/`
Each domain (invoice, payment, expense, payable, reconciliation, report, dashboard) has its own controller + service.

---

## 5. API design

- Global prefix `api`, all finance routes under `/api/fin/...`
- ~39 endpoints across 7 controllers
- **Single response shape:** `{ success, message, data }`
- **Paginated shape:** `{ data: [], total, page, limit, totalPages }`
- Examples: `GET /api/fin/invoices`, `POST /api/fin/payments`,
  `POST /api/fin/expenses/:id/approve`, `GET /api/fin/reports/pnl`

**Q: How do you handle validation?**
Each endpoint has a DTO class with class-validator decorators (`@IsString`, `@IsNumber`,
`@IsIn`, `@Min`). NestJS's ValidationPipe rejects bad input with a 400 before it hits the service.

---

## 6. Screens (18) — grouped

- **Dashboards:** CFO Dashboard, AR/AP Aging, Cash Flow
- **Invoicing:** Invoice Register, Invoice Builder, Invoice Detail, Credit/Debit Notes
- **Payments:** Payment List, Reconciliation Desk, Receipt View
- **Receivables:** AR Aging Report, Dunning Management
- **Payables:** Vendor Bills, Payout Schedule
- **Expenses:** Expense Approval (with create + approve/reject)
- **Reports:** GST/TDS, P&L, Audit Trail

Everything reads/writes live PostgreSQL data — no hardcoded values.

---

## 7. Key features to mention
- GST-compliant invoices with line items and tax rules (CGST/SGST/IGST)
- Payment recording across UPI / Card / Bank / Cash / Cheque
- Expense approval workflow (pending → approved/rejected)
- Vendor payout scheduling + disbursement
- Event-level P&L with auto-computed margin
- AR aging buckets & dunning escalation
- Immutable audit trail
- CSV export and print/PDF on list & document screens

---

## 8. Likely tricky questions

**Q: What happens to invoice totals — computed where?**
In the service layer on the backend. The frontend sends quantity, unit price, GST rate; the
backend computes line amount, subtotal, tax total, and grand total, then stores them. Never trust
the client for money math.

**Q: How is the P&L margin calculated?**
`pnl.margin` is a Postgres GENERATED column (`revenue - direct_cost`), so it's always consistent
and can't drift from the source values.

**Q: How do you prevent unauthorized table changes / least privilege?**
The app connects as a restricted DB user (`eventhub_dev`) that can only SELECT/INSERT/UPDATE.
Table creation is reserved for the DBA/superuser via pgAdmin — the app can never alter the schema.

**Q: How does the frontend know if a user can approve expenses?**
A role-based `usePermissions` hook maps roles (super_admin, finance_manager, accountant, auditor)
to permissions like `expense.approve`; buttons are hidden if the role lacks the permission.

**Q: What's the audit trail and why VARCHAR for user_id there?**
It records every financial action immutably. `user_id` is stored loosely so it can capture system
or external actors, while the real FK relationships live on the business tables.

---

## 9. "What did YOU do?" (be specific)
- Designed all 9 Finance tables + the DDL script with constraints, indexes, triggers, GST seed data
- Built 7 controllers + services + DTOs + entities on the backend
- Built all 18 React screens and wired them to the APIs with React Query
- Integrated frontend ↔ backend, verified every CRUD write lands in PostgreSQL
- Added validation, error handling, and an audit trail
- Ensured no hardcoded data — every figure traces to a DB query

---

## 10. If asked something you didn't build
GST e-filing integration, TDS, multi-currency, and intercompany transfers are **future scope** —
the schema and UI are ready, but live data sources for those don't exist yet. Be honest: "That's
planned; right now the module computes GST output tax from real invoice tax totals."
