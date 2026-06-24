-- ============================================================
-- STEP 5: MODULE 4 - Event Management
-- Run AFTER: STEP4
-- ============================================================

CREATE TABLE IF NOT EXISTS event (
    event_id        BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id      BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    branch_id       BIGINT REFERENCES branch(branch_id) ON DELETE RESTRICT,
    booking_id      BIGINT NOT NULL REFERENCES booking(booking_id) ON DELETE RESTRICT,
    venue_id        BIGINT REFERENCES venue(venue_id) ON DELETE RESTRICT,
    start_dt        TIMESTAMPTZ,
    end_dt          TIMESTAMPTZ,
    headcount       INT,
    budget_planned  DECIMAL(14,2) DEFAULT 0,
    budget_actual   DECIMAL(14,2) DEFAULT 0,
    status          VARCHAR(15) DEFAULT 'Planning',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    created_by      BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
    updated_by      BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS event_phase (
    phase_id    BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    event_id    BIGINT NOT NULL REFERENCES event(event_id) ON DELETE CASCADE,
    name        VARCHAR(60) NOT NULL,
    start_dt    TIMESTAMPTZ,
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS event_task (
    task_id     BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    event_id    BIGINT NOT NULL REFERENCES event(event_id) ON DELETE CASCADE,
    phase_id    BIGINT REFERENCES event_phase(phase_id) ON DELETE SET NULL,
    owner_id    BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
    depends_on  BIGINT REFERENCES event_task(task_id) ON DELETE SET NULL,
    due_at      TIMESTAMPTZ,
    status      VARCHAR(15) DEFAULT 'todo',
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS run_of_show (
    ros_id      BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    event_id    BIGINT NOT NULL REFERENCES event(event_id) ON DELETE CASCADE,
    cue_time    TIMESTAMPTZ NOT NULL,
    activity    VARCHAR(160),
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS crew_allocation (
    alloc_id    BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    event_id    BIGINT NOT NULL REFERENCES event(event_id) ON DELETE CASCADE,
    user_id     BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
    resource    VARCHAR(80),
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS incident (
    incident_id BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    event_id    BIGINT NOT NULL REFERENCES event(event_id) ON DELETE CASCADE,
    severity    VARCHAR(10) DEFAULT 'low',
    notes       VARCHAR(255),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS feedback (
    feedback_id BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    event_id    BIGINT NOT NULL REFERENCES event(event_id) ON DELETE CASCADE,
    rating      INT,
    comments    VARCHAR(255),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_event_booking ON event(booking_id);
CREATE INDEX IF NOT EXISTS idx_event_company ON event(company_id);
CREATE INDEX IF NOT EXISTS idx_event_task_event ON event_task(event_id);
CREATE INDEX IF NOT EXISTS idx_event_phase_event ON event_phase(event_id);
