-- ============================================================
-- STEP 10: MODULE 9 - Hotel & Resort PMS
-- Run AFTER: STEP5, STEP7
-- ============================================================

CREATE TABLE IF NOT EXISTS property (
    property_id BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    name        VARCHAR(150) NOT NULL,
    location_id BIGINT REFERENCES location(location_id) ON DELETE SET NULL,
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS room_type (
    room_type_id    BIGSERIAL PRIMARY KEY,
    property_id     BIGINT NOT NULL REFERENCES property(property_id) ON DELETE CASCADE,
    name            VARCHAR(60) NOT NULL,
    base_rate       DECIMAL(12,2) DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS hotel_room (
    room_id         BIGSERIAL PRIMARY KEY,
    property_id     BIGINT NOT NULL REFERENCES property(property_id) ON DELETE CASCADE,
    room_type_id    BIGINT NOT NULL REFERENCES room_type(room_type_id) ON DELETE RESTRICT,
    room_no         VARCHAR(12) NOT NULL,
    status          VARCHAR(15) DEFAULT 'Clean',
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS rate_plan (
    rate_plan_id    BIGSERIAL PRIMARY KEY,
    room_type_id    BIGINT NOT NULL REFERENCES room_type(room_type_id) ON DELETE CASCADE,
    name            VARCHAR(60) NOT NULL,
    rate            DECIMAL(12,2) DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS room_block (
    block_id    BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    event_id    BIGINT REFERENCES event(event_id) ON DELETE SET NULL,
    property_id BIGINT NOT NULL REFERENCES property(property_id) ON DELETE RESTRICT,
    rooms_held  INT DEFAULT 0,
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS reservation (
    reservation_id  BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id      BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    room_id         BIGINT NOT NULL REFERENCES hotel_room(room_id) ON DELETE RESTRICT,
    guest_id        BIGINT NOT NULL REFERENCES guest(guest_id) ON DELETE RESTRICT,
    block_id        BIGINT REFERENCES room_block(block_id) ON DELETE SET NULL,
    check_in        DATE NOT NULL,
    check_out       DATE NOT NULL,
    status          VARCHAR(15) DEFAULT 'Held',
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS folio (
    folio_id        BIGSERIAL PRIMARY KEY,
    reservation_id  BIGINT NOT NULL REFERENCES reservation(reservation_id) ON DELETE CASCADE,
    balance         DECIMAL(12,2) DEFAULT 0,
    status          VARCHAR(12) DEFAULT 'open',
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS folio_line (
    folio_line_id   BIGSERIAL PRIMARY KEY,
    folio_id        BIGINT NOT NULL REFERENCES folio(folio_id) ON DELETE CASCADE,
    description     VARCHAR(120),
    amount          DECIMAL(12,2) DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS housekeeping (
    hk_id       BIGSERIAL PRIMARY KEY,
    room_id     BIGINT NOT NULL REFERENCES hotel_room(room_id) ON DELETE CASCADE,
    status      VARCHAR(15) DEFAULT 'dirty',
    assigned_to BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_property_company ON property(company_id);
CREATE INDEX IF NOT EXISTS idx_reservation_room ON reservation(room_id);
CREATE INDEX IF NOT EXISTS idx_reservation_guest ON reservation(guest_id);
