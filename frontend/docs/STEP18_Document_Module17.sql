-- ============================================================
-- STEP 18: MODULE 17 - Document Management
-- Run AFTER: STEP1
-- ============================================================

CREATE TABLE IF NOT EXISTS document (
    document_id     BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id      BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    entity          VARCHAR(40),
    entity_id       BIGINT,
    name            VARCHAR(160) NOT NULL,
    storage_key     VARCHAR(255) NOT NULL,
    classification  VARCHAR(20),
    expires_at      DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    created_by      BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS document_version (
    version_id      BIGSERIAL PRIMARY KEY,
    document_id     BIGINT NOT NULL REFERENCES document(document_id) ON DELETE CASCADE,
    version_no      INT DEFAULT 1,
    storage_key     VARCHAR(255) NOT NULL,
    uploaded_by     BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS esign (
    esign_id        BIGSERIAL PRIMARY KEY,
    document_id     BIGINT NOT NULL REFERENCES document(document_id) ON DELETE CASCADE,
    signer_email    VARCHAR(160) NOT NULL,
    signed_at       TIMESTAMPTZ,
    status          VARCHAR(15) DEFAULT 'pending',
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS doc_template (
    doc_template_id BIGSERIAL PRIMARY KEY,
    company_id      BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    name            VARCHAR(80) NOT NULL,
    body            TEXT,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_document_entity ON document(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_document_company ON document(company_id);
