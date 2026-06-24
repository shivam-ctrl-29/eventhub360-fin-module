-- ============================================================
-- STEP 7: MODULE 6 - Guest Management
-- Run AFTER: STEP5
-- ============================================================

CREATE TABLE IF NOT EXISTS guest (
    guest_id    BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    name        VARCHAR(120) NOT NULL,
    phone       VARCHAR(20),
    category    VARCHAR(20),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS guest_group (
    group_id    BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    event_id    BIGINT NOT NULL REFERENCES event(event_id) ON DELETE CASCADE,
    name        VARCHAR(60),
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS event_guest (
    event_guest_id  BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id      BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    event_id        BIGINT NOT NULL REFERENCES event(event_id) ON DELETE CASCADE,
    guest_id        BIGINT NOT NULL REFERENCES guest(guest_id) ON DELETE CASCADE,
    group_id        BIGINT REFERENCES guest_group(group_id) ON DELETE SET NULL,
    invited         BOOLEAN DEFAULT FALSE,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS rsvp (
    rsvp_id         BIGSERIAL PRIMARY KEY,
    event_guest_id  BIGINT NOT NULL REFERENCES event_guest(event_guest_id) ON DELETE CASCADE,
    status          VARCHAR(12) DEFAULT 'maybe',
    pax             INT DEFAULT 1,
    responded_at    TIMESTAMPTZ,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS seating (
    seating_id      BIGSERIAL PRIMARY KEY,
    event_guest_id  BIGINT NOT NULL REFERENCES event_guest(event_guest_id) ON DELETE CASCADE,
    table_no        VARCHAR(10),
    seat_no         VARCHAR(10),
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS meal_pref (
    meal_pref_id    BIGSERIAL PRIMARY KEY,
    event_guest_id  BIGINT NOT NULL REFERENCES event_guest(event_guest_id) ON DELETE CASCADE,
    preference      VARCHAR(40),
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS guest_checkin (
    checkin_id      BIGSERIAL PRIMARY KEY,
    event_guest_id  BIGINT NOT NULL REFERENCES event_guest(event_guest_id) ON DELETE CASCADE,
    checked_in_at   TIMESTAMPTZ DEFAULT NOW(),
    qr_code         VARCHAR(64),
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_event_guest_event ON event_guest(event_id);
CREATE INDEX IF NOT EXISTS idx_event_guest_guest ON event_guest(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_company ON guest(company_id);
