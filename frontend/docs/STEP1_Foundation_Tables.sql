-- ============================================================
-- STEP 1: FOUNDATION TABLES (Run this FIRST)
-- EventHub 360 - Module 0: Multi-Tenancy, RBAC & Master Data
-- ============================================================
-- Run this in pgAdmin on supervisor's machine (postgres superuser)
-- ALL other modules depend on these tables
-- ============================================================

-- 1. TENANT (Top-level white-label boundary)
CREATE TABLE IF NOT EXISTS tenant (
    tenant_id   BIGSERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    subdomain   VARCHAR(80)  NOT NULL UNIQUE,
    plan        VARCHAR(20),
    status      VARCHAR(15)  DEFAULT 'active',
    is_active   BOOLEAN      DEFAULT TRUE
);

-- 2. COMPANY (Legal operating entity inside a tenant)
CREATE TABLE IF NOT EXISTS company (
    company_id      BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    name            VARCHAR(150) NOT NULL,
    gstin           VARCHAR(15),
    pan             VARCHAR(10),
    base_currency   CHAR(3) DEFAULT 'INR',
    is_active       BOOLEAN DEFAULT TRUE
);

-- 3. LOCATION (Reusable geographic master)
CREATE TABLE IF NOT EXISTS location (
    location_id BIGSERIAL PRIMARY KEY,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    city        VARCHAR(80),
    state       VARCHAR(80),
    country     VARCHAR(60),
    is_active   BOOLEAN DEFAULT TRUE
);

-- 4. BRANCH (Physical/operational unit of a company)
CREATE TABLE IF NOT EXISTS branch (
    branch_id   BIGSERIAL PRIMARY KEY,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    name        VARCHAR(120) NOT NULL,
    city        VARCHAR(80),
    location_id BIGINT REFERENCES location(location_id) ON DELETE RESTRICT,
    is_active   BOOLEAN DEFAULT TRUE
);

-- 5. USER_ACCOUNT (Login identity scoped to a company)
CREATE TABLE IF NOT EXISTS user_account (
    user_id         BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id      BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    email           VARCHAR(160) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(120),
    phone           VARCHAR(20),
    mfa_enabled     BOOLEAN DEFAULT FALSE,
    status          VARCHAR(15) DEFAULT 'active',
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(email, tenant_id)
);

-- 6. ROLE (Named bundle of permissions)
CREATE TABLE IF NOT EXISTS role (
    role_id     BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    name        VARCHAR(60) NOT NULL,
    scope       VARCHAR(20) DEFAULT 'company',
    is_system   BOOLEAN DEFAULT FALSE,
    is_active   BOOLEAN DEFAULT TRUE
);

-- 7. PERMISSION (Single grantable capability)
CREATE TABLE IF NOT EXISTS permission (
    permission_id   BIGSERIAL PRIMARY KEY,
    code            VARCHAR(80) NOT NULL UNIQUE,
    module          VARCHAR(40),
    action          VARCHAR(30),
    description     VARCHAR(160),
    is_active       BOOLEAN DEFAULT TRUE
);

-- 8. ROLE_PERMISSION (Junction: which permissions a role has)
CREATE TABLE IF NOT EXISTS role_permission (
    role_id         BIGINT NOT NULL REFERENCES role(role_id) ON DELETE CASCADE,
    permission_id   BIGINT NOT NULL REFERENCES permission(permission_id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 9. USER_ROLE (Junction: which roles a user has, optionally per branch)
CREATE TABLE IF NOT EXISTS user_role (
    user_id     BIGINT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
    role_id     BIGINT NOT NULL REFERENCES role(role_id) ON DELETE CASCADE,
    branch_id   BIGINT REFERENCES branch(branch_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 10. VENUE (Bookable venue/hall/space master)
CREATE TABLE IF NOT EXISTS venue (
    venue_id    BIGSERIAL PRIMARY KEY,
    branch_id   BIGINT NOT NULL REFERENCES branch(branch_id) ON DELETE RESTRICT,
    name        VARCHAR(120) NOT NULL,
    type        VARCHAR(30),
    capacity    INT,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TAX_RULE (GST/tax configuration master)
CREATE TABLE IF NOT EXISTS tax_rule (
    tax_rule_id BIGSERIAL PRIMARY KEY,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    name        VARCHAR(60) NOT NULL,
    cgst_pct    DECIMAL(5,2) DEFAULT 0,
    sgst_pct    DECIMAL(5,2) DEFAULT 0,
    igst_pct    DECIMAL(5,2) DEFAULT 0,
    hsn_sac     VARCHAR(12),
    is_active   BOOLEAN DEFAULT TRUE
);

-- 12. NUMBERING_SCHEME (Auto-generates human references like INV-2026-0001)
CREATE TABLE IF NOT EXISTS numbering_scheme (
    scheme_id   BIGSERIAL PRIMARY KEY,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    entity      VARCHAR(30) NOT NULL,
    prefix      VARCHAR(15),
    next_no     BIGINT DEFAULT 1,
    is_active   BOOLEAN DEFAULT TRUE
);

-- 13. AUDIT_LOG (Immutable who/what/when/old->new record)
CREATE TABLE IF NOT EXISTS audit_log (
    audit_id    BIGSERIAL PRIMARY KEY,
    user_id     BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
    entity      VARCHAR(40) NOT NULL,
    entity_id   BIGINT NOT NULL,
    action      VARCHAR(20) NOT NULL,
    old_value   JSONB,
    new_value   JSONB,
    ip_address  VARCHAR(45),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_company_tenant ON company(tenant_id);
CREATE INDEX IF NOT EXISTS idx_branch_company ON branch(company_id);
CREATE INDEX IF NOT EXISTS idx_user_account_company ON user_account(company_id);
CREATE INDEX IF NOT EXISTS idx_user_account_tenant ON user_account(tenant_id);
CREATE INDEX IF NOT EXISTS idx_venue_branch ON venue(branch_id);
CREATE INDEX IF NOT EXISTS idx_tax_rule_company ON tax_rule(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity, entity_id);

-- ============================================================
-- VERIFY: Run this after creation to confirm all 13 tables exist
-- ============================================================
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- ORDER BY table_name;
