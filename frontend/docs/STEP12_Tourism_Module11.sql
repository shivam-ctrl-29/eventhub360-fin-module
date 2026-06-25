-- ============================================================
-- STEP 12: MODULE 11 - Tourism, Packages & Itinerary
-- Run AFTER: STEP2
-- ============================================================

CREATE TABLE IF NOT EXISTS tour_package (
    package_id  BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id  BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    name        VARCHAR(150) NOT NULL,
    nights      INT DEFAULT 0,
    base_price  DECIMAL(12,2) DEFAULT 0,
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS itinerary_day (
    day_id      BIGSERIAL PRIMARY KEY,
    package_id  BIGINT NOT NULL REFERENCES tour_package(package_id) ON DELETE CASCADE,
    day_no      INT NOT NULL,
    title       VARCHAR(120),
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS itinerary_item (
    item_id     BIGSERIAL PRIMARY KEY,
    day_id      BIGINT NOT NULL REFERENCES itinerary_day(day_id) ON DELETE CASCADE,
    type        VARCHAR(20),
    description VARCHAR(200),
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS departure (
    departure_id    BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id      BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    package_id      BIGINT NOT NULL REFERENCES tour_package(package_id) ON DELETE RESTRICT,
    start_date      DATE NOT NULL,
    seats_total     INT DEFAULT 0,
    seats_sold      INT DEFAULT 0,
    cutoff_date     DATE,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS tour_booking (
    tour_booking_id BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id      BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    departure_id    BIGINT NOT NULL REFERENCES departure(departure_id) ON DELETE RESTRICT,
    lead_id         BIGINT REFERENCES lead(lead_id) ON DELETE SET NULL,
    pax             INT DEFAULT 1,
    total           DECIMAL(12,2) DEFAULT 0,
    status          VARCHAR(15) DEFAULT 'held',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS traveller (
    traveller_id    BIGSERIAL PRIMARY KEY,
    tour_booking_id BIGINT NOT NULL REFERENCES tour_booking(tour_booking_id) ON DELETE CASCADE,
    name            VARCHAR(120) NOT NULL,
    passport_no     VARCHAR(20),
    visa_status     VARCHAR(15) DEFAULT 'pending',
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS voucher (
    voucher_id      BIGSERIAL PRIMARY KEY,
    tour_booking_id BIGINT NOT NULL REFERENCES tour_booking(tour_booking_id) ON DELETE CASCADE,
    type            VARCHAR(15),
    ref_no          VARCHAR(40),
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_tour_package_company ON tour_package(company_id);
CREATE INDEX IF NOT EXISTS idx_departure_package ON departure(package_id);
CREATE INDEX IF NOT EXISTS idx_tour_booking_departure ON tour_booking(departure_id);
