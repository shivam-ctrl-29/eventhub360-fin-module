-- ============================================================
-- STEP 21: MODULE 20 - Admin & Configuration
-- Run AFTER: STEP1
-- ============================================================

CREATE TABLE IF NOT EXISTS workflow_def (
    workflow_def_id BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id      BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    name            VARCHAR(80) NOT NULL,
    entity          VARCHAR(40),
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS workflow_step (
    workflow_step_id    BIGSERIAL PRIMARY KEY,
    workflow_def_id     BIGINT NOT NULL REFERENCES workflow_def(workflow_def_id) ON DELETE CASCADE,
    step_order          INT DEFAULT 1,
    action              VARCHAR(40),
    assignee_role_id    BIGINT REFERENCES role(role_id) ON DELETE SET NULL,
    is_active           BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS integration (
    integration_id  BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id      BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    provider        VARCHAR(40) NOT NULL,
    config          JSONB,
    status          VARCHAR(15) DEFAULT 'active',
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS master_data (
    master_data_id  BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    domain          VARCHAR(40) NOT NULL,
    code            VARCHAR(40) NOT NULL,
    label           VARCHAR(80) NOT NULL,
    sort_order      INT DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    UNIQUE (tenant_id, domain, code)
);

CREATE INDEX IF NOT EXISTS idx_workflow_def_company ON workflow_def(company_id);
CREATE INDEX IF NOT EXISTS idx_master_data_domain ON master_data(tenant_id, domain);
CREATE INDEX IF NOT EXISTS idx_integration_company ON integration(company_id);
