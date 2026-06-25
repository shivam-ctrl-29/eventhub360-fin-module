-- ============================================================
-- EventHub 360 — Finance & Accounting Module (FIN)
-- Database Schema — Run as superuser (postgres)
-- ============================================================

-- Grant permissions to eventhub_dev after creating tables
-- Run: GRANT ALL ON ALL TABLES IN SCHEMA public TO eventhub_dev;

CREATE TABLE IF NOT EXISTS customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID REFERENCES companies(id),
  branch_id       UUID REFERENCES branches(id),
  customer_code   VARCHAR(20) UNIQUE,
  name            VARCHAR(255) NOT NULL,
  email           VARCHAR(255),
  phone           VARCHAR(20),
  gstin           VARCHAR(15),
  pan             VARCHAR(10),
  billing_address TEXT,
  city            VARCHAR(100),
  state           VARCHAR(100),
  credit_limit    DECIMAL(15,2) DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID REFERENCES companies(id),
  vendor_code     VARCHAR(20) UNIQUE,
  name            VARCHAR(255) NOT NULL,
  email           VARCHAR(255),
  phone           VARCHAR(20),
  gstin           VARCHAR(15),
  pan             VARCHAR(10),
  bank_name       VARCHAR(100),
  account_number  VARCHAR(30),
  ifsc_code       VARCHAR(11),
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  VARCHAR(20) UNIQUE NOT NULL,
  customer_id     UUID NOT NULL REFERENCES customers(id),
  branch_id       UUID REFERENCES branches(id),
  status          VARCHAR(20) NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','sent','partial','paid','overdue','cancelled')),
  issue_date      DATE NOT NULL,
  due_date        DATE NOT NULL,
  subtotal        DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_gst       DECIMAL(15,2) NOT NULL DEFAULT 0,
  grand_total     DECIMAL(15,2) NOT NULL DEFAULT 0,
  amount_paid     DECIMAL(15,2) NOT NULL DEFAULT 0,
  amount_due      DECIMAL(15,2) GENERATED ALWAYS AS (grand_total - amount_paid) STORED,
  is_inter_state  BOOLEAN DEFAULT false,
  payment_mode    VARCHAR(20) CHECK (payment_mode IN ('upi','bank_transfer','cheque','cash','card')),
  notes           TEXT,
  terms           TEXT,
  created_by      UUID REFERENCES users(id),
  sent_at         TIMESTAMP,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description  VARCHAR(200) NOT NULL,
  quantity     DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  unit_price   DECIMAL(15,2) NOT NULL CHECK (unit_price > 0),
  gst_rate     SMALLINT NOT NULL CHECK (gst_rate IN (0,5,12,18,28)),
  taxable_amt  DECIMAL(15,2) NOT NULL,
  cgst         DECIMAL(15,2) NOT NULL DEFAULT 0,
  sgst         DECIMAL(15,2) NOT NULL DEFAULT 0,
  igst         DECIMAL(15,2) NOT NULL DEFAULT 0,
  gst_amount   DECIMAL(15,2) NOT NULL DEFAULT 0,
  total        DECIMAL(15,2) NOT NULL,
  sort_order   SMALLINT DEFAULT 0,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_line_items_invoice ON invoice_line_items(invoice_id);

CREATE TABLE IF NOT EXISTS credit_notes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_number    VARCHAR(20) UNIQUE NOT NULL,
  original_invoice_id   UUID NOT NULL REFERENCES invoices(id),
  customer_id           UUID NOT NULL REFERENCES customers(id),
  reason                TEXT NOT NULL,
  subtotal              DECIMAL(15,2) NOT NULL DEFAULT 0,
  gst_amount            DECIMAL(15,2) NOT NULL DEFAULT 0,
  grand_total           DECIMAL(15,2) NOT NULL DEFAULT 0,
  status                VARCHAR(20) DEFAULT 'issued' CHECK (status IN ('issued','applied','cancelled')),
  date                  DATE NOT NULL,
  created_by            UUID REFERENCES users(id),
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS debit_notes (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debit_note_number    VARCHAR(20) UNIQUE NOT NULL,
  original_invoice_id  UUID REFERENCES invoices(id),
  vendor_id            UUID REFERENCES vendors(id),
  reason               TEXT NOT NULL,
  subtotal             DECIMAL(15,2) NOT NULL DEFAULT 0,
  gst_amount           DECIMAL(15,2) NOT NULL DEFAULT 0,
  grand_total          DECIMAL(15,2) NOT NULL DEFAULT 0,
  status               VARCHAR(20) DEFAULT 'issued' CHECK (status IN ('issued','applied','cancelled')),
  date                 DATE NOT NULL,
  created_by           UUID REFERENCES users(id),
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number  VARCHAR(20) UNIQUE NOT NULL,
  invoice_id      UUID NOT NULL REFERENCES invoices(id),
  amount          DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  payment_mode    VARCHAR(20) NOT NULL CHECK (payment_mode IN ('upi','bank_transfer','cheque','cash','card')),
  utr_number      VARCHAR(50) UNIQUE,
  cheque_number   VARCHAR(20),
  bank_name       VARCHAR(100),
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','processing','settled','failed','refunded')),
  payment_date    DATE NOT NULL,
  remarks         TEXT,
  recorded_by     UUID REFERENCES users(id),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_utr ON payments(utr_number);

CREATE TABLE IF NOT EXISTS bank_reconciliation_entries (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_description     TEXT NOT NULL,
  utr_number           VARCHAR(50) UNIQUE NOT NULL,
  amount               DECIMAL(15,2) NOT NULL,
  transaction_date     DATE NOT NULL,
  matched_invoice_id   UUID REFERENCES invoices(id),
  matched_payment_id   UUID REFERENCES payments(id),
  is_reconciled        BOOLEAN DEFAULT false,
  reconciled_by        UUID REFERENCES users(id),
  reconciled_at        TIMESTAMP,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendor_bills (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number     VARCHAR(50) NOT NULL,
  vendor_id       UUID NOT NULL REFERENCES vendors(id),
  branch_id       UUID REFERENCES branches(id),
  amount          DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  gst_amount      DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_amount    DECIMAL(15,2) NOT NULL,
  bill_date       DATE NOT NULL,
  due_date        DATE NOT NULL,
  status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','overdue')),
  priority        VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('critical','high','medium','low')),
  category        VARCHAR(100),
  document_url    TEXT,
  approved_by     UUID REFERENCES users(id),
  approved_at     TIMESTAMP,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (bill_number, vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_vendor_bills_vendor ON vendor_bills(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_bills_status ON vendor_bills(status);

CREATE TABLE IF NOT EXISTS payout_schedule (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       UUID NOT NULL REFERENCES vendors(id),
  bill_id         UUID NOT NULL REFERENCES vendor_bills(id),
  amount          DECIMAL(15,2) NOT NULL,
  scheduled_date  DATE NOT NULL,
  priority        VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('critical','high','medium','low')),
  status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','disbursed')),
  approved_by     UUID REFERENCES users(id),
  approved_at     TIMESTAMP,
  disbursed_at    TIMESTAMP,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID NOT NULL REFERENCES users(id),
  branch_id       UUID REFERENCES branches(id),
  category        VARCHAR(50) NOT NULL
                  CHECK (category IN ('food_beverage','logistics','travel','marketing','venue','decor','miscellaneous')),
  description     TEXT NOT NULL,
  amount          DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  receipt_url     TEXT,
  submitted_date  DATE NOT NULL,
  status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','reimbursed')),
  approved_by     UUID REFERENCES users(id),
  approved_date   DATE,
  remarks         TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expenses_employee ON expenses(employee_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);

CREATE TABLE IF NOT EXISTS expense_budgets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id    UUID REFERENCES branches(id),
  category     VARCHAR(50) NOT NULL,
  month        SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year         SMALLINT NOT NULL,
  budgeted     DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (branch_id, category, month, year)
);

CREATE TABLE IF NOT EXISTS gst_filings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id       UUID REFERENCES branches(id),
  period          VARCHAR(7) NOT NULL,
  return_type     VARCHAR(10) NOT NULL CHECK (return_type IN ('GSTR1','GSTR2A','GSTR3B')),
  gst_output      DECIMAL(15,2) NOT NULL DEFAULT 0,
  gst_input       DECIMAL(15,2) NOT NULL DEFAULT 0,
  itc_available   DECIMAL(15,2) NOT NULL DEFAULT 0,
  itc_utilized    DECIMAL(15,2) NOT NULL DEFAULT 0,
  net_payable     DECIMAL(15,2) NOT NULL DEFAULT 0,
  filing_status   VARCHAR(15) DEFAULT 'pending' CHECK (filing_status IN ('filed','pending','late_filed')),
  filed_date      DATE,
  due_date        DATE NOT NULL,
  filed_by        UUID REFERENCES users(id),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (branch_id, period, return_type)
);

CREATE TABLE IF NOT EXISTS hsn_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      UUID REFERENCES invoices(id),
  gst_filing_id   UUID REFERENCES gst_filings(id),
  hsn_code        VARCHAR(8) NOT NULL,
  description     VARCHAR(200),
  quantity        DECIMAL(10,2),
  taxable_value   DECIMAL(15,2) NOT NULL,
  gst_rate        SMALLINT NOT NULL CHECK (gst_rate IN (0,5,12,18,28)),
  gst_amount      DECIMAL(15,2) NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tds_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       UUID REFERENCES vendors(id),
  section         VARCHAR(10) NOT NULL CHECK (section IN ('194C','194J','194I','194H')),
  period          VARCHAR(7) NOT NULL,
  gross_amount    DECIMAL(15,2) NOT NULL,
  tds_rate        DECIMAL(5,2) NOT NULL,
  tds_amount      DECIMAL(15,2) NOT NULL,
  deposited_date  DATE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dunning_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id         UUID NOT NULL REFERENCES customers(id),
  invoice_id          UUID NOT NULL REFERENCES invoices(id),
  dunning_level       VARCHAR(5) NOT NULL CHECK (dunning_level IN ('L1','L2','L3','L4')),
  action_date         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  next_action_date    DATE,
  emails_sent         SMALLINT DEFAULT 0,
  status              VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','resolved','escalated')),
  notes               TEXT,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dunning_customer ON dunning_records(customer_id);
CREATE INDEX IF NOT EXISTS idx_dunning_invoice ON dunning_records(invoice_id);

CREATE TABLE IF NOT EXISTS fin_audit_trail (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,
  entity      VARCHAR(50) NOT NULL,
  entity_id   UUID,
  description TEXT NOT NULL,
  severity    VARCHAR(10) DEFAULT 'info' CHECK (severity IN ('info','success','warning','error')),
  ip_address  INET,
  metadata    JSONB,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fin_audit_entity ON fin_audit_trail(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_fin_audit_created ON fin_audit_trail(created_at);

-- Grant all permissions to eventhub_dev
GRANT ALL ON ALL TABLES IN SCHEMA public TO eventhub_dev;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO eventhub_dev;
