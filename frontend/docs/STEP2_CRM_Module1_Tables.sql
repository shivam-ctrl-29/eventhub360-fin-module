-- ============================================================
-- STEP 2: MODULE 1 - CRM & Lead Management Tables
-- EventHub 360 - Code: CRM | Phase: MVP / Phase 1
-- ============================================================
-- Run this AFTER STEP1_Foundation_Tables.sql is done
-- These tables ONLY reference foundation tables (company, user_account)
-- They do NOT touch any other module's tables
-- ============================================================

-- Standard columns added on every table:
-- tenant_id, company_id, branch_id, created_at, updated_at,
-- created_by, updated_by, is_active

-- 1. ACCOUNT (An organisation: corporate client, family unit, agency)
CREATE TABLE IF NOT EXISTS account (
    account_id  BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    branch_id   BIGINT REFERENCES branch(branch_id) ON DELETE RESTRICT,
    name        VARCHAR(150) NOT NULL,
    type        VARCHAR(20),           -- Corporate / Family / Agency
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    created_by  BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
    updated_by  BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
    is_active   BOOLEAN DEFAULT TRUE
);

-- 2. CONTACT (A person: decision-maker, family member, corporate POC)
CREATE TABLE IF NOT EXISTS contact (
    contact_id  BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    branch_id   BIGINT REFERENCES branch(branch_id) ON DELETE RESTRICT,
    account_id  BIGINT REFERENCES account(account_id) ON DELETE SET NULL,  -- nullable
    name        VARCHAR(120) NOT NULL,
    phone       VARCHAR(20),
    email       VARCHAR(160),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    created_by  BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
    updated_by  BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
    is_active   BOOLEAN DEFAULT TRUE
);

-- 3. LEAD_SOURCE (Lookup of acquisition channels)
CREATE TABLE IF NOT EXISTS lead_source (
    source_id   BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    name        VARCHAR(40) NOT NULL,  -- Web / WhatsApp / Referral / Ads
    is_active   BOOLEAN DEFAULT TRUE
);

-- 4. PIPELINE_STAGE (Configurable funnel stage)
CREATE TABLE IF NOT EXISTS pipeline_stage (
    stage_id    BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    name        VARCHAR(30) NOT NULL,  -- New / Contacted / Qualified / Proposal / Won / Lost
    sort_order  INT DEFAULT 0,
    is_active   BOOLEAN DEFAULT TRUE
);

-- 5. LEAD (A single sales opportunity / enquiry)
CREATE TABLE IF NOT EXISTS lead (
    lead_id     BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    branch_id   BIGINT REFERENCES branch(branch_id) ON DELETE RESTRICT,
    contact_id  BIGINT REFERENCES contact(contact_id) ON DELETE SET NULL,
    source_id   BIGINT REFERENCES lead_source(source_id) ON DELETE SET NULL,
    stage_id    BIGINT REFERENCES pipeline_stage(stage_id) ON DELETE SET NULL,
    owner_id    BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,  -- sales owner
    event_type  VARCHAR(40),           -- Wedding / Corporate / Tour
    event_date  DATE,
    headcount   INT,
    budget      DECIMAL(14,2),
    score       INT DEFAULT 0,         -- Lead score 0-100
    status      VARCHAR(15) DEFAULT 'open',  -- open / won / lost
    lost_reason VARCHAR(120),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    created_by  BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
    updated_by  BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
    is_active   BOOLEAN DEFAULT TRUE
);

-- 6. LEAD_ACTIVITY (Timeline entry: call, email, meeting, whatsapp)
CREATE TABLE IF NOT EXISTS lead_activity (
    activity_id BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    lead_id     BIGINT NOT NULL REFERENCES lead(lead_id) ON DELETE CASCADE,
    type        VARCHAR(20) NOT NULL,  -- call / email / meeting / whatsapp
    summary     VARCHAR(255),
    occurred_at TIMESTAMPTZ DEFAULT NOW(),
    created_by  BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
    is_active   BOOLEAN DEFAULT TRUE
);

-- 7. TASK (Follow-up to-do with reminder)
CREATE TABLE IF NOT EXISTS task (
    task_id     BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    lead_id     BIGINT REFERENCES lead(lead_id) ON DELETE CASCADE,   -- nullable
    assignee_id BIGINT NOT NULL REFERENCES user_account(user_id) ON DELETE RESTRICT,
    due_at      TIMESTAMPTZ,
    status      VARCHAR(15) DEFAULT 'open',  -- open / done
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    created_by  BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
    updated_by  BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
    is_active   BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_account_company ON account(company_id);
CREATE INDEX IF NOT EXISTS idx_contact_company ON contact(company_id);
CREATE INDEX IF NOT EXISTS idx_contact_account ON contact(account_id);
CREATE INDEX IF NOT EXISTS idx_lead_company ON lead(company_id);
CREATE INDEX IF NOT EXISTS idx_lead_contact ON lead(contact_id);
CREATE INDEX IF NOT EXISTS idx_lead_owner ON lead(owner_id);
CREATE INDEX IF NOT EXISTS idx_lead_stage ON lead(stage_id);
CREATE INDEX IF NOT EXISTS idx_lead_status ON lead(status);
CREATE INDEX IF NOT EXISTS idx_lead_activity_lead ON lead_activity(lead_id);
CREATE INDEX IF NOT EXISTS idx_task_lead ON task(lead_id);
CREATE INDEX IF NOT EXISTS idx_task_assignee ON task(assignee_id);

-- ============================================================
-- VERIFY: Run this to confirm CRM tables were created
-- ============================================================
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name IN (
--   'account','contact','lead_source','pipeline_stage',
--   'lead','lead_activity','task'
-- )
-- ORDER BY table_name;
