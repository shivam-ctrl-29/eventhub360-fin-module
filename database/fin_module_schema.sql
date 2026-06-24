-- ============================================================
--  EventHub 360 — Module 12: Finance & Accounting
--  Database Schema Script
--  Author  : Shivam Mathur
--  Module  : FIN (Finance & Accounting)
--  Run As  : PostgreSQL superuser (via pgAdmin)
--  Target  : eventhub_demo  |  Host: 135.235.157.63:5432
-- ============================================================
--
--  Prerequisites (tables from other modules must exist first):
--    tenant, company, branch, user_account
--
--  Instructions for supervisor:
--    1. Open pgAdmin and connect to eventhub_demo
--    2. Open Query Tool
--    3. Paste this entire script and click Run (F5)
--    4. Grant permissions at the bottom after tables are created
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- STEP 1: Auto-update trigger function (shared utility)
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fin_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- ──────────────────────────────────────────────────────────
-- STEP 2: TAX RULE
--   Stores GST rate configurations (CGST/SGST/IGST)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tax_rule (
  tax_rule_id  BIGSERIAL PRIMARY KEY,
  company_id   BIGINT REFERENCES company(company_id) ON DELETE RESTRICT,
  name         VARCHAR(60),
  cgst_pct     NUMERIC(5,2)  DEFAULT 0,
  sgst_pct     NUMERIC(5,2)  DEFAULT 0,
  igst_pct     NUMERIC(5,2)  DEFAULT 0,
  hsn_sac      VARCHAR(12)
);

-- Seed default GST slabs
INSERT INTO tax_rule (company_id, name, cgst_pct, sgst_pct, igst_pct, hsn_sac)
VALUES
  (1, 'GST 0%',   0,    0,    0,    '998596'),
  (1, 'GST 5%',   2.5,  2.5,  5,    '998596'),
  (1, 'GST 12%',  6,    6,    12,   '998596'),
  (1, 'GST 18%',  9,    9,    18,   '998596'),
  (1, 'GST 28%',  14,   14,   28,   '998596')
ON CONFLICT DO NOTHING;


-- ──────────────────────────────────────────────────────────
-- STEP 3: INVOICE
--   Core AR document — Tax Invoice or Proforma Invoice
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice (
  invoice_id  BIGSERIAL PRIMARY KEY,
  tenant_id   BIGINT       NOT NULL REFERENCES tenant(tenant_id)     ON DELETE RESTRICT,
  company_id  BIGINT       NOT NULL REFERENCES company(company_id)   ON DELETE RESTRICT,
  branch_id   BIGINT                REFERENCES branch(branch_id)     ON DELETE RESTRICT,
  booking_id  BIGINT,                            -- FK to booking module (cross-module)
  invoice_no  VARCHAR(30)  NOT NULL UNIQUE,
  type        VARCHAR(12)  NOT NULL DEFAULT 'Tax'
                           CHECK (type IN ('Proforma', 'Tax')),
  subtotal    NUMERIC(14,2) NOT NULL,
  tax_total   NUMERIC(14,2) NOT NULL DEFAULT 0,
  total       NUMERIC(14,2) NOT NULL,
  balance     NUMERIC(14,2) NOT NULL,
  status      VARCHAR(12)  NOT NULL DEFAULT 'Draft'
                           CHECK (status IN ('Draft','Issued','Paid','Overdue','Cancelled')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_by  BIGINT                REFERENCES user_account(user_id),
  updated_by  BIGINT                REFERENCES user_account(user_id),
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_invoice_company  ON invoice (company_id);
CREATE INDEX IF NOT EXISTS idx_invoice_status   ON invoice (status) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_invoice_booking  ON invoice (booking_id) WHERE booking_id IS NOT NULL;

CREATE OR REPLACE TRIGGER trg_invoice_updated_at
  BEFORE UPDATE ON invoice
  FOR EACH ROW EXECUTE FUNCTION fin_set_updated_at();


-- ──────────────────────────────────────────────────────────
-- STEP 4: INVOICE LINE
--   Individual line items on an invoice
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_line (
  invoice_line_id  BIGSERIAL PRIMARY KEY,
  tenant_id        BIGINT       NOT NULL REFERENCES tenant(tenant_id)     ON DELETE RESTRICT,
  company_id       BIGINT       NOT NULL REFERENCES company(company_id)   ON DELETE RESTRICT,
  branch_id        BIGINT                REFERENCES branch(branch_id)     ON DELETE RESTRICT,
  invoice_id       BIGINT       NOT NULL REFERENCES invoice(invoice_id)   ON DELETE CASCADE,
  description      VARCHAR(200) NOT NULL,
  qty              NUMERIC(10,2) NOT NULL DEFAULT 1 CHECK (qty > 0),
  rate             NUMERIC(14,2) NOT NULL            CHECK (rate >= 0),
  amount           NUMERIC(14,2) NOT NULL,
  tax_rule_id      BIGINT                REFERENCES tax_rule(tax_rule_id) ON DELETE RESTRICT,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_by       BIGINT                REFERENCES user_account(user_id),
  updated_by       BIGINT                REFERENCES user_account(user_id),
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_inv_line_invoice ON invoice_line (invoice_id);

CREATE OR REPLACE TRIGGER trg_invoice_line_updated_at
  BEFORE UPDATE ON invoice_line
  FOR EACH ROW EXECUTE FUNCTION fin_set_updated_at();


-- ──────────────────────────────────────────────────────────
-- STEP 5: PAYMENT
--   Records payment receipts against invoices
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment (
  payment_id   BIGSERIAL PRIMARY KEY,
  tenant_id    BIGINT       NOT NULL REFERENCES tenant(tenant_id)   ON DELETE RESTRICT,
  company_id   BIGINT       NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
  branch_id    BIGINT                REFERENCES branch(branch_id)   ON DELETE RESTRICT,
  invoice_id   BIGINT       NOT NULL REFERENCES invoice(invoice_id) ON DELETE RESTRICT,
  mode         VARCHAR(15)  NOT NULL
               CHECK (mode IN ('UPI','Card','Bank','Cash','Cheque')),
  amount       NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  gateway_ref  VARCHAR(60),            -- UTR / transaction reference
  paid_at      TIMESTAMPTZ  NOT NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_by   BIGINT                REFERENCES user_account(user_id),
  updated_by   BIGINT                REFERENCES user_account(user_id),
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_payment_invoice ON payment (invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_paid_at ON payment (paid_at DESC);

CREATE OR REPLACE TRIGGER trg_payment_updated_at
  BEFORE UPDATE ON payment
  FOR EACH ROW EXECUTE FUNCTION fin_set_updated_at();


-- ──────────────────────────────────────────────────────────
-- STEP 6: EXPENSE
--   Employee reimbursement claims and event expenses
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expense (
  expense_id   BIGSERIAL PRIMARY KEY,
  tenant_id    BIGINT       NOT NULL REFERENCES tenant(tenant_id)   ON DELETE RESTRICT,
  company_id   BIGINT       NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
  branch_id    BIGINT                REFERENCES branch(branch_id)   ON DELETE RESTRICT,
  event_id     BIGINT,                -- FK to event module (cross-module)
  category     VARCHAR(40)  NOT NULL
               CHECK (category IN ('food_beverage','logistics','travel','marketing','venue','decor','miscellaneous')),
  description  TEXT,
  amount       NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  receipt_url  TEXT,
  status       VARCHAR(15)  NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','approved','rejected','reimbursed')),
  approved_by  BIGINT                REFERENCES user_account(user_id),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_by   BIGINT                REFERENCES user_account(user_id),
  updated_by   BIGINT                REFERENCES user_account(user_id),
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_expense_company ON expense (company_id);
CREATE INDEX IF NOT EXISTS idx_expense_status  ON expense (status) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_expense_event   ON expense (event_id) WHERE event_id IS NOT NULL;

CREATE OR REPLACE TRIGGER trg_expense_updated_at
  BEFORE UPDATE ON expense
  FOR EACH ROW EXECUTE FUNCTION fin_set_updated_at();


-- ──────────────────────────────────────────────────────────
-- STEP 7: PAYOUT
--   Vendor payment scheduling and disbursement tracking
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payout (
  payout_id          BIGSERIAL PRIMARY KEY,
  tenant_id          BIGINT       NOT NULL REFERENCES tenant(tenant_id)   ON DELETE RESTRICT,
  company_id         BIGINT       NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
  branch_id          BIGINT                REFERENCES branch(branch_id)   ON DELETE RESTRICT,
  vendor_invoice_id  BIGINT,               -- FK to vendor invoice (AP module)
  amount             NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  status             VARCHAR(15)  NOT NULL DEFAULT 'scheduled'
                     CHECK (status IN ('scheduled','approved','paid')),
  scheduled_date     DATE,
  paid_at            TIMESTAMPTZ,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_by         BIGINT                REFERENCES user_account(user_id),
  updated_by         BIGINT                REFERENCES user_account(user_id),
  is_active          BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_payout_status ON payout (status) WHERE is_active;

CREATE OR REPLACE TRIGGER trg_payout_updated_at
  BEFORE UPDATE ON payout
  FOR EACH ROW EXECUTE FUNCTION fin_set_updated_at();


-- ──────────────────────────────────────────────────────────
-- STEP 8: CREDIT NOTE
--   Issued against an invoice for refunds / billing corrections
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credit_note (
  credit_note_id  BIGSERIAL PRIMARY KEY,
  tenant_id       BIGINT       NOT NULL REFERENCES tenant(tenant_id)   ON DELETE RESTRICT,
  company_id      BIGINT       NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
  branch_id       BIGINT                REFERENCES branch(branch_id)   ON DELETE RESTRICT,
  invoice_id      BIGINT       NOT NULL REFERENCES invoice(invoice_id) ON DELETE RESTRICT,
  amount          NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  reason          VARCHAR(160) NOT NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_by      BIGINT                REFERENCES user_account(user_id),
  updated_by      BIGINT                REFERENCES user_account(user_id),
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_credit_note_inv ON credit_note (invoice_id);

CREATE OR REPLACE TRIGGER trg_credit_note_updated_at
  BEFORE UPDATE ON credit_note
  FOR EACH ROW EXECUTE FUNCTION fin_set_updated_at();


-- ──────────────────────────────────────────────────────────
-- STEP 9: PNL (Profit & Loss per Event)
--   Stores per-event revenue and cost for margin tracking
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pnl (
  pnl_id       BIGSERIAL PRIMARY KEY,
  tenant_id    BIGINT       NOT NULL REFERENCES tenant(tenant_id)   ON DELETE RESTRICT,
  company_id   BIGINT       NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
  branch_id    BIGINT                REFERENCES branch(branch_id)   ON DELETE RESTRICT,
  event_id     BIGINT       UNIQUE,   -- one P&L record per event
  revenue      NUMERIC(14,2) NOT NULL DEFAULT 0,
  direct_cost  NUMERIC(14,2) NOT NULL DEFAULT 0,
  margin       NUMERIC(14,2) GENERATED ALWAYS AS (revenue - direct_cost) STORED,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_by   BIGINT                REFERENCES user_account(user_id),
  updated_by   BIGINT                REFERENCES user_account(user_id),
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_pnl_event ON pnl (event_id) WHERE event_id IS NOT NULL;

CREATE OR REPLACE TRIGGER trg_pnl_updated_at
  BEFORE UPDATE ON pnl
  FOR EACH ROW EXECUTE FUNCTION fin_set_updated_at();


-- ──────────────────────────────────────────────────────────
-- STEP 10: FIN AUDIT TRAIL
--   Immutable log of all finance operations
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fin_audit_trail (
  audit_id     BIGSERIAL PRIMARY KEY,
  tenant_id    BIGINT       DEFAULT 1,
  company_id   BIGINT       DEFAULT 1,
  user_id      VARCHAR(60),
  action       VARCHAR(60)  NOT NULL,
  entity       VARCHAR(60),
  entity_id    VARCHAR(60),
  description  TEXT,
  severity     VARCHAR(15)  DEFAULT 'info'
               CHECK (severity IN ('info','success','warning','error')),
  ip_address   VARCHAR(45),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_audit_created  ON fin_audit_trail (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action   ON fin_audit_trail (action);
CREATE INDEX IF NOT EXISTS idx_audit_severity ON fin_audit_trail (severity);


-- ──────────────────────────────────────────────────────────
-- STEP 11: GRANT PERMISSIONS to app user
--   Run this after all tables are created
-- ──────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE ON
  tax_rule, invoice, invoice_line, payment,
  expense, payout, credit_note, pnl, fin_audit_trail
TO eventhub_dev;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO eventhub_dev;


-- ──────────────────────────────────────────────────────────
-- DONE
-- ──────────────────────────────────────────────────────────
-- Tables created for Module 12 – Finance & Accounting:
--   1.  tax_rule          — GST rate slabs
--   2.  invoice           — Tax/Proforma invoices (AR)
--   3.  invoice_line      — Line items per invoice
--   4.  payment           — Payment receipts
--   5.  expense           — Employee / event expenses
--   6.  payout            — Vendor payout schedule (AP)
--   7.  credit_note       — Credit notes against invoices
--   8.  pnl               — Per-event Profit & Loss
--   9.  fin_audit_trail   — Immutable audit log
-- ──────────────────────────────────────────────────────────
