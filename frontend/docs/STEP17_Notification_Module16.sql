-- ============================================================
-- STEP 17: MODULE 16 - Notification Engine
-- Run AFTER: STEP1
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_template (
    template_id BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    name        VARCHAR(80) NOT NULL,
    channel     VARCHAR(12),
    body        TEXT,
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS channel_config (
    channel_config_id   BIGSERIAL PRIMARY KEY,
    company_id          BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    channel             VARCHAR(12) NOT NULL,
    provider            VARCHAR(40),
    is_active           BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS notification (
    notification_id BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    template_id     BIGINT NOT NULL REFERENCES notification_template(template_id) ON DELETE RESTRICT,
    recipient_id    BIGINT,
    channel         VARCHAR(12),
    status          VARCHAR(15) DEFAULT 'queued',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS delivery_log (
    delivery_id         BIGSERIAL PRIMARY KEY,
    notification_id     BIGINT NOT NULL REFERENCES notification(notification_id) ON DELETE CASCADE,
    attempt_no          INT DEFAULT 1,
    result              VARCHAR(20),
    logged_at           TIMESTAMPTZ DEFAULT NOW(),
    is_active           BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS reminder_rule (
    reminder_rule_id    BIGSERIAL PRIMARY KEY,
    company_id          BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    trigger             VARCHAR(40),
    offset_days         INT DEFAULT 0,
    template_id         BIGINT NOT NULL REFERENCES notification_template(template_id) ON DELETE RESTRICT,
    is_active           BOOLEAN DEFAULT TRUE
);
