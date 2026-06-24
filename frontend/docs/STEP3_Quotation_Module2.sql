-- ============================================================
-- STEP 3: MODULE 2 - Quotation & Proposal Management
-- Run AFTER: STEP1 + STEP2
-- ============================================================

CREATE TABLE IF NOT EXISTS price_book (
    price_book_id   BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id      BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    name            VARCHAR(60) NOT NULL,
    valid_from      DATE,
    valid_to        DATE,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS rate_card (
    rate_card_id    BIGSERIAL PRIMARY KEY,
    price_book_id   BIGINT NOT NULL REFERENCES price_book(price_book_id) ON DELETE CASCADE,
    item_name       VARCHAR(120) NOT NULL,
    uom             VARCHAR(15),
    rate            DECIMAL(14,2) NOT NULL,
    cost            DECIMAL(14,2),
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS package (
    package_id  BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    name        VARCHAR(120) NOT NULL,
    base_price  DECIMAL(14,2),
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS quotation (
    quotation_id    BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id      BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    branch_id       BIGINT REFERENCES branch(branch_id) ON DELETE RESTRICT,
    lead_id         BIGINT NOT NULL REFERENCES lead(lead_id) ON DELETE RESTRICT,
    version         INT DEFAULT 1,
    currency        CHAR(3) DEFAULT 'INR',
    subtotal        DECIMAL(14,2) DEFAULT 0,
    tax_total       DECIMAL(14,2) DEFAULT 0,
    total           DECIMAL(14,2) DEFAULT 0,
    cost_total      DECIMAL(14,2) DEFAULT 0,
    margin          DECIMAL(14,2) DEFAULT 0,
    status          VARCHAR(15) DEFAULT 'Draft',
    expires_at      DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    created_by      BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
    updated_by      BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS quotation_line (
    line_id         BIGSERIAL PRIMARY KEY,
    quotation_id    BIGINT NOT NULL REFERENCES quotation(quotation_id) ON DELETE CASCADE,
    item_type       VARCHAR(20),
    ref_id          BIGINT,
    description     VARCHAR(200),
    qty             DECIMAL(10,2) DEFAULT 1,
    rate            DECIMAL(14,2) DEFAULT 0,
    cost            DECIMAL(14,2) DEFAULT 0,
    tax_rule_id     BIGINT REFERENCES tax_rule(tax_rule_id) ON DELETE SET NULL,
    amount          DECIMAL(14,2) DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS quote_approval (
    approval_id     BIGSERIAL PRIMARY KEY,
    quotation_id    BIGINT NOT NULL REFERENCES quotation(quotation_id) ON DELETE CASCADE,
    approver_id     BIGINT NOT NULL REFERENCES user_account(user_id) ON DELETE RESTRICT,
    status          VARCHAR(15) DEFAULT 'pending',
    decided_at      TIMESTAMPTZ,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_quotation_lead ON quotation(lead_id);
CREATE INDEX IF NOT EXISTS idx_quotation_company ON quotation(company_id);
CREATE INDEX IF NOT EXISTS idx_quotation_line_quotation ON quotation_line(quotation_id);
