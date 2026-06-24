-- ============================================================
-- STEP 9: MODULE 8 - Transportation & Fleet
-- Run AFTER: STEP7, STEP7
-- ============================================================

CREATE TABLE IF NOT EXISTS vehicle (
    vehicle_id  BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    type        VARCHAR(30),
    capacity    INT,
    reg_no      VARCHAR(20) NOT NULL UNIQUE,
    owner_type  VARCHAR(10) DEFAULT 'Owned',
    vendor_id   BIGINT REFERENCES vendor(vendor_id) ON DELETE SET NULL,
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS driver (
    driver_id   BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    name        VARCHAR(120) NOT NULL,
    licence_no  VARCHAR(30),
    phone       VARCHAR(20),
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS guide (
    guide_id    BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    name        VARCHAR(120) NOT NULL,
    languages   VARCHAR(120),
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS trip (
    trip_id     BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    event_id    BIGINT REFERENCES event(event_id) ON DELETE SET NULL,
    vehicle_id  BIGINT NOT NULL REFERENCES vehicle(vehicle_id) ON DELETE RESTRICT,
    driver_id   BIGINT REFERENCES driver(driver_id) ON DELETE SET NULL,
    guide_id    BIGINT REFERENCES guide(guide_id) ON DELETE SET NULL,
    start_dt    TIMESTAMPTZ,
    route       VARCHAR(200),
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS trip_passenger (
    trip_passenger_id   BIGSERIAL PRIMARY KEY,
    trip_id             BIGINT NOT NULL REFERENCES trip(trip_id) ON DELETE CASCADE,
    event_guest_id      BIGINT NOT NULL REFERENCES event_guest(event_guest_id) ON DELETE CASCADE,
    is_active           BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS transport_cost (
    cost_id     BIGSERIAL PRIMARY KEY,
    trip_id     BIGINT NOT NULL REFERENCES trip(trip_id) ON DELETE CASCADE,
    type        VARCHAR(15),
    amount      DECIMAL(12,2) DEFAULT 0,
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_vehicle_company ON vehicle(company_id);
CREATE INDEX IF NOT EXISTS idx_trip_event ON trip(event_id);
CREATE INDEX IF NOT EXISTS idx_trip_vehicle ON trip(vehicle_id);
