-- ============================================================
-- STEP 20: MODULE 19 - Client & Guest Portals / Mobile Apps
-- Run AFTER: STEP1, STEP2
-- ============================================================

CREATE TABLE IF NOT EXISTS portal_user (
    portal_user_id  BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    email           VARCHAR(160) NOT NULL,
    entity          VARCHAR(20),
    entity_id       BIGINT,
    password_hash   VARCHAR(255),
    last_login_at   TIMESTAMPTZ,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS portal_session (
    session_id      BIGSERIAL PRIMARY KEY,
    portal_user_id  BIGINT NOT NULL REFERENCES portal_user(portal_user_id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    ip_address      INET,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS portal_request (
    portal_request_id   BIGSERIAL PRIMARY KEY,
    tenant_id           BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    portal_user_id      BIGINT NOT NULL REFERENCES portal_user(portal_user_id) ON DELETE CASCADE,
    request_type        VARCHAR(30),
    payload             JSONB,
    status              VARCHAR(15) DEFAULT 'pending',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    is_active           BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS device_token (
    device_token_id BIGSERIAL PRIMARY KEY,
    portal_user_id  BIGINT NOT NULL REFERENCES portal_user(portal_user_id) ON DELETE CASCADE,
    platform        VARCHAR(10),
    token           VARCHAR(255) NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS offline_sync (
    sync_id         BIGSERIAL PRIMARY KEY,
    portal_user_id  BIGINT NOT NULL REFERENCES portal_user(portal_user_id) ON DELETE CASCADE,
    entity          VARCHAR(40),
    entity_id       BIGINT,
    synced_at       TIMESTAMPTZ DEFAULT NOW(),
    checksum        VARCHAR(64),
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_portal_user_tenant ON portal_user(tenant_id);
CREATE INDEX IF NOT EXISTS idx_portal_session_user ON portal_session(portal_user_id);
CREATE INDEX IF NOT EXISTS idx_device_token_user ON device_token(portal_user_id);
