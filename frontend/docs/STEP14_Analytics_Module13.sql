-- ============================================================
-- STEP 14: MODULE 13 - Analytics & Business Intelligence
-- Run AFTER: STEP1
-- ============================================================

CREATE TABLE IF NOT EXISTS dashboard (
    dashboard_id        BIGSERIAL PRIMARY KEY,
    tenant_id           BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id          BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    name                VARCHAR(80) NOT NULL,
    audience_role_id    BIGINT REFERENCES role(role_id) ON DELETE SET NULL,
    is_active           BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS report_def (
    report_def_id   BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id      BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    name            VARCHAR(80) NOT NULL,
    dataset         VARCHAR(40),
    config          JSONB,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS kpi_target (
    kpi_target_id   BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id      BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    metric          VARCHAR(60) NOT NULL,
    target_value    DECIMAL(14,2),
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS scheduled_report (
    scheduled_id    BIGSERIAL PRIMARY KEY,
    report_def_id   BIGINT NOT NULL REFERENCES report_def(report_def_id) ON DELETE CASCADE,
    frequency       VARCHAR(15) DEFAULT 'weekly',
    format          VARCHAR(10) DEFAULT 'pdf',
    is_active       BOOLEAN DEFAULT TRUE
);
