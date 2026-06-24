-- ============================================================
-- STEP 13: MODULE 12 - Finance & Accounting
-- Run AFTER: STEP4, STEP5, STEP8
-- ============================================================

CREATE TABLE IF NOT EXISTS invoice (
    invoice_id  BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    branch_id   BIGINT REFERENCES branch(branch_id) ON DELETE RESTRICT,
    booking_id  BIGINT NOT NULL REFERENCES booking(booking_id) ON DELETE RESTRICT,
    invoice_no  VARCHAR(30) NOT NULL UNIQUE,
    type        VARCHAR(12) DEFAULT 'Tax',
    subtotal    DECIMAL(14,2) DEFAULT 0,
    tax_total   DECIMAL(14,2) DEFAULT 0,
    total       DECIMAL(14,2) DEFAULT 0,
    balance     DECIMAL(14,2) DEFAULT 0,
    status      VARCHAR(12) DEFAULT 'Draft',
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    created_by  BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
    updated_by  BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS invoice_line (
    invoice_line_id BIGSERIAL PRIMARY KEY,
    invoice_id      BIGINT NOT NULL REFERENCES invoice(invoice_id) ON DELETE CASCADE,
    description     VARCHAR(200),
    amount          DECIMAL(14,2) DEFAULT 0,
    tax_rule_id     BIGINT REFERENCES tax_rule(tax_rule_id) ON DELETE SET NULL,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS payment (
    payment_id  BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    invoice_id  BIGINT NOT NULL REFERENCES invoice(invoice_id) ON DELETE RESTRICT,
    mode        VARCHAR(15),
    amount      DECIMAL(14,2) NOT NULL,
    gateway_ref VARCHAR(60),
    paid_at     TIMESTAMPTZ DEFAULT NOW(),
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS expense (
    expense_id  BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    event_id    BIGINT REFERENCES event(event_id) ON DELETE SET NULL,
    category    VARCHAR(40),
    amount      DECIMAL(14,2) NOT NULL,
    status      VARCHAR(15) DEFAULT 'pending',
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    created_by  BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS payout (
    payout_id           BIGSERIAL PRIMARY KEY,
    tenant_id           BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id          BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    vendor_invoice_id   BIGINT REFERENCES vendor_invoice(vendor_invoice_id) ON DELETE SET NULL,
    amount              DECIMAL(14,2) NOT NULL,
    status              VARCHAR(15) DEFAULT 'scheduled',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    is_active           BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS credit_note (
    credit_note_id  BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id      BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    invoice_id      BIGINT NOT NULL REFERENCES invoice(invoice_id) ON DELETE RESTRICT,
    amount          DECIMAL(14,2) NOT NULL,
    reason          VARCHAR(160),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS pnl (
    pnl_id      BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    event_id    BIGINT NOT NULL REFERENCES event(event_id) ON DELETE CASCADE,
    revenue     DECIMAL(14,2) DEFAULT 0,
    direct_cost DECIMAL(14,2) DEFAULT 0,
    margin      DECIMAL(14,2) DEFAULT 0,
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_invoice_booking ON invoice(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoice_company ON invoice(company_id);
CREATE INDEX IF NOT EXISTS idx_invoice_status ON invoice(tenant_id, status, balance);
CREATE INDEX IF NOT EXISTS idx_payment_invoice ON payment(invoice_id);
CREATE INDEX IF NOT EXISTS idx_expense_event ON expense(event_id);
CREATE INDEX IF NOT EXISTS idx_pnl_event ON pnl(event_id);
