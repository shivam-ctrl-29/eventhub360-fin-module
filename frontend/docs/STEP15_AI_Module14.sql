-- ============================================================
-- STEP 15: MODULE 14 - AI Automation Platform
-- Run AFTER: STEP1
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_config (
    ai_config_id    BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    backend         VARCHAR(30) DEFAULT 'openai',
    monthly_budget  DECIMAL(12,2) DEFAULT 0,
    pii_masking     BOOLEAN DEFAULT TRUE,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ai_request (
    ai_request_id   BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id      BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    user_id         BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
    feature         VARCHAR(30),
    prompt_ref      VARCHAR(64),
    status          VARCHAR(15) DEFAULT 'ok',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ai_recommendation (
    recommendation_id   BIGSERIAL PRIMARY KEY,
    ai_request_id       BIGINT NOT NULL REFERENCES ai_request(ai_request_id) ON DELETE CASCADE,
    entity              VARCHAR(40),
    entity_id           BIGINT,
    payload             JSONB,
    accepted            BOOLEAN DEFAULT FALSE,
    is_active           BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS embedding_index (
    embedding_id    BIGSERIAL PRIMARY KEY,
    company_id      BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    entity          VARCHAR(40),
    entity_id       BIGINT,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ai_usage (
    usage_id        BIGSERIAL PRIMARY KEY,
    ai_config_id    BIGINT NOT NULL REFERENCES ai_config(ai_config_id) ON DELETE CASCADE,
    tokens          BIGINT DEFAULT 0,
    cost            DECIMAL(10,4) DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    is_active       BOOLEAN DEFAULT TRUE
);
