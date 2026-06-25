-- ============================================================
-- STEP 19: MODULE 18 - White-Label & Multi-Tenant Platform
-- Run AFTER: STEP1
-- ============================================================

CREATE TABLE IF NOT EXISTS plan (
    plan_id         BIGSERIAL PRIMARY KEY,
    name            VARCHAR(40) NOT NULL,
    price_monthly   DECIMAL(10,2) DEFAULT 0,
    user_limit      INT,
    storage_gb      INT,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS subscription (
    subscription_id BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    plan_id         BIGINT NOT NULL REFERENCES plan(plan_id) ON DELETE RESTRICT,
    status          VARCHAR(15) DEFAULT 'active',
    renews_at       DATE,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS branding (
    branding_id     BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    logo_key        VARCHAR(255),
    primary_color   VARCHAR(9),
    custom_domain   VARCHAR(120),
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS usage_meter (
    meter_id    BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    metric      VARCHAR(30) NOT NULL,
    value       BIGINT DEFAULT 0,
    period      VARCHAR(7),
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS tenant_config (
    tenant_config_id    BIGSERIAL PRIMARY KEY,
    tenant_id           BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    config_key          VARCHAR(60) NOT NULL,
    config_value        JSONB,
    is_active           BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_subscription_tenant ON subscription(tenant_id);
CREATE INDEX IF NOT EXISTS idx_branding_tenant ON branding(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_meter_tenant ON usage_meter(tenant_id);
