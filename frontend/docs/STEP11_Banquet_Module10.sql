-- ============================================================
-- STEP 11: MODULE 10 - Banquet Management
-- Run AFTER: STEP10
-- ============================================================

CREATE TABLE IF NOT EXISTS banquet_hall (
    hall_id     BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    property_id BIGINT REFERENCES property(property_id) ON DELETE SET NULL,
    name        VARCHAR(100) NOT NULL,
    capacity    INT,
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS beo (
    beo_id          BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id      BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    hall_id         BIGINT NOT NULL REFERENCES banquet_hall(hall_id) ON DELETE RESTRICT,
    event_id        BIGINT REFERENCES event(event_id) ON DELETE SET NULL,
    function_date   DATE,
    pax             INT,
    status          VARCHAR(15) DEFAULT 'draft',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS banquet_menu (
    menu_id         BIGSERIAL PRIMARY KEY,
    beo_id          BIGINT NOT NULL REFERENCES beo(beo_id) ON DELETE CASCADE,
    name            VARCHAR(80) NOT NULL,
    veg_type        VARCHAR(12),
    per_pax_rate    DECIMAL(10,2) DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS setup_layout (
    layout_id       BIGSERIAL PRIMARY KEY,
    beo_id          BIGINT NOT NULL REFERENCES beo(beo_id) ON DELETE CASCADE,
    style           VARCHAR(20),
    capacity_check  INT,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS banquet_addon (
    addon_id    BIGSERIAL PRIMARY KEY,
    beo_id      BIGINT NOT NULL REFERENCES beo(beo_id) ON DELETE CASCADE,
    name        VARCHAR(80),
    price       DECIMAL(10,2) DEFAULT 0,
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS banquet_billing (
    billing_id      BIGSERIAL PRIMARY KEY,
    beo_id          BIGINT NOT NULL REFERENCES beo(beo_id) ON DELETE CASCADE,
    subtotal        DECIMAL(12,2) DEFAULT 0,
    service_charge  DECIMAL(12,2) DEFAULT 0,
    total           DECIMAL(12,2) DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_beo_hall ON beo(hall_id);
CREATE INDEX IF NOT EXISTS idx_beo_event ON beo(event_id);
