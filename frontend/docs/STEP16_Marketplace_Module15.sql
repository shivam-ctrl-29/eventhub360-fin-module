-- ============================================================
-- STEP 16: MODULE 15 - Marketplace
-- Run AFTER: STEP8
-- ============================================================

CREATE TABLE IF NOT EXISTS mkt_listing (
    listing_id  BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    vendor_id   BIGINT NOT NULL REFERENCES vendor(vendor_id) ON DELETE CASCADE,
    title       VARCHAR(150) NOT NULL,
    category    VARCHAR(40),
    verified    BOOLEAN DEFAULT FALSE,
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS mkt_enquiry (
    enquiry_id          BIGSERIAL PRIMARY KEY,
    listing_id          BIGINT NOT NULL REFERENCES mkt_listing(listing_id) ON DELETE CASCADE,
    buyer_company_id    BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    message             VARCHAR(255),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    is_active           BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS mkt_order (
    mkt_order_id        BIGSERIAL PRIMARY KEY,
    tenant_id           BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    listing_id          BIGINT NOT NULL REFERENCES mkt_listing(listing_id) ON DELETE RESTRICT,
    buyer_company_id    BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    amount              DECIMAL(14,2) NOT NULL,
    status              VARCHAR(15) DEFAULT 'placed',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    is_active           BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS commission (
    commission_id   BIGSERIAL PRIMARY KEY,
    mkt_order_id    BIGINT NOT NULL REFERENCES mkt_order(mkt_order_id) ON DELETE CASCADE,
    rate_pct        DECIMAL(5,2) DEFAULT 0,
    amount          DECIMAL(12,2) DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS mkt_review (
    review_id   BIGSERIAL PRIMARY KEY,
    listing_id  BIGINT NOT NULL REFERENCES mkt_listing(listing_id) ON DELETE CASCADE,
    score       INT,
    comment     VARCHAR(255),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    is_active   BOOLEAN DEFAULT TRUE
);
