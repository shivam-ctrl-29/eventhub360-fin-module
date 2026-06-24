-- ============================================================
-- STEP 6: MODULE 5 - Wedding & Destination Wedding
-- Run AFTER: STEP5
-- ============================================================

CREATE TABLE IF NOT EXISTS wedding_workspace (
    workspace_id    BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id      BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    event_id        BIGINT NOT NULL REFERENCES event(event_id) ON DELETE CASCADE,
    couple_names    VARCHAR(160),
    destination_id  BIGINT REFERENCES location(location_id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS function (
    function_id     BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id      BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    workspace_id    BIGINT NOT NULL REFERENCES wedding_workspace(workspace_id) ON DELETE CASCADE,
    name            VARCHAR(40) NOT NULL,
    venue_id        BIGINT REFERENCES venue(venue_id) ON DELETE SET NULL,
    start_dt        TIMESTAMPTZ,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS wedding_package (
    wed_package_id  BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id      BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    workspace_id    BIGINT NOT NULL REFERENCES wedding_workspace(workspace_id) ON DELETE CASCADE,
    name            VARCHAR(120),
    price           DECIMAL(14,2),
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS family_group (
    family_id       BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id      BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    workspace_id    BIGINT NOT NULL REFERENCES wedding_workspace(workspace_id) ON DELETE CASCADE,
    name            VARCHAR(60),
    budget_share    DECIMAL(14,2) DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS hospitality_desk (
    desk_id         BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id      BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    workspace_id    BIGINT NOT NULL REFERENCES wedding_workspace(workspace_id) ON DELETE CASCADE,
    location_id     BIGINT REFERENCES location(location_id) ON DELETE SET NULL,
    incharge_id     BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS moodboard (
    moodboard_id    BIGSERIAL PRIMARY KEY,
    function_id     BIGINT NOT NULL REFERENCES function(function_id) ON DELETE CASCADE,
    approved        BOOLEAN DEFAULT FALSE,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_wedding_event ON wedding_workspace(event_id);
CREATE INDEX IF NOT EXISTS idx_function_workspace ON function(workspace_id);
