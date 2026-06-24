-- ============================================================
-- STEP 8: MODULE 7 - Vendor Management
-- Run AFTER: STEP5, STEP6
-- ============================================================

CREATE TABLE IF NOT EXISTS vendor_category (
    category_id BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    name        VARCHAR(40) NOT NULL,
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS vendor (
    vendor_id       BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id      BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    category_id     BIGINT REFERENCES vendor_category(category_id) ON DELETE SET NULL,
    name            VARCHAR(150) NOT NULL,
    gstin           VARCHAR(15),
    pan             VARCHAR(10),
    bank_account    VARCHAR(40),
    rating          DECIMAL(3,2) DEFAULT 0,
    is_blacklisted  BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS vendor_service (
    service_id  BIGSERIAL PRIMARY KEY,
    vendor_id   BIGINT NOT NULL REFERENCES vendor(vendor_id) ON DELETE CASCADE,
    name        VARCHAR(120) NOT NULL,
    rate        DECIMAL(14,2),
    uom         VARCHAR(15),
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS event_vendor (
    event_vendor_id BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id      BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    event_id        BIGINT NOT NULL REFERENCES event(event_id) ON DELETE CASCADE,
    function_id     BIGINT REFERENCES function(function_id) ON DELETE SET NULL,
    vendor_id       BIGINT NOT NULL REFERENCES vendor(vendor_id) ON DELETE RESTRICT,
    scope           VARCHAR(120),
    cost            DECIMAL(14,2) DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS purchase_order (
    po_id           BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id      BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    po_ref          VARCHAR(30) NOT NULL UNIQUE,
    event_vendor_id BIGINT NOT NULL REFERENCES event_vendor(event_vendor_id) ON DELETE RESTRICT,
    amount          DECIMAL(14,2) NOT NULL,
    status          VARCHAR(15) DEFAULT 'draft',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS vendor_invoice (
    vendor_invoice_id   BIGSERIAL PRIMARY KEY,
    tenant_id           BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id          BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    po_id               BIGINT NOT NULL REFERENCES purchase_order(po_id) ON DELETE RESTRICT,
    amount              DECIMAL(14,2) NOT NULL,
    status              VARCHAR(15) DEFAULT 'submitted',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    is_active           BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS vendor_rating (
    rating_id       BIGSERIAL PRIMARY KEY,
    event_vendor_id BIGINT NOT NULL REFERENCES event_vendor(event_vendor_id) ON DELETE CASCADE,
    score           INT,
    remarks         VARCHAR(200),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_vendor_company ON vendor(company_id);
CREATE INDEX IF NOT EXISTS idx_event_vendor_event ON event_vendor(event_id);
CREATE INDEX IF NOT EXISTS idx_po_event_vendor ON purchase_order(event_vendor_id);
