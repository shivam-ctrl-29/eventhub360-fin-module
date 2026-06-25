-- ============================================================
-- STEP 4: MODULE 3 - Booking & Sales Pipeline
-- Run AFTER: STEP3
-- ============================================================

CREATE TABLE IF NOT EXISTS booking (
    booking_id      BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
    company_id      BIGINT NOT NULL REFERENCES company(company_id) ON DELETE RESTRICT,
    branch_id       BIGINT REFERENCES branch(branch_id) ON DELETE RESTRICT,
    booking_ref     VARCHAR(30) NOT NULL UNIQUE,
    quotation_id    BIGINT NOT NULL REFERENCES quotation(quotation_id) ON DELETE RESTRICT,
    venue_id        BIGINT REFERENCES venue(venue_id) ON DELETE RESTRICT,
    event_date      DATE,
    status          VARCHAR(15) DEFAULT 'Tentative',
    hold_expires_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    created_by      BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
    updated_by      BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS booking_hold (
    hold_id     BIGSERIAL PRIMARY KEY,
    booking_id  BIGINT NOT NULL REFERENCES booking(booking_id) ON DELETE CASCADE,
    venue_id    BIGINT NOT NULL REFERENCES venue(venue_id) ON DELETE RESTRICT,
    hold_date   DATE NOT NULL,
    expires_at  TIMESTAMPTZ,
    is_active   BOOLEAN DEFAULT TRUE,
    UNIQUE(venue_id, hold_date)
);

CREATE TABLE IF NOT EXISTS deposit_schedule (
    schedule_id BIGSERIAL PRIMARY KEY,
    booking_id  BIGINT NOT NULL REFERENCES booking(booking_id) ON DELETE CASCADE,
    due_date    DATE NOT NULL,
    amount      DECIMAL(14,2) NOT NULL,
    status      VARCHAR(15) DEFAULT 'pending',
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS change_order (
    change_id   BIGSERIAL PRIMARY KEY,
    booking_id  BIGINT NOT NULL REFERENCES booking(booking_id) ON DELETE CASCADE,
    description VARCHAR(255),
    delta_amount DECIMAL(14,2) DEFAULT 0,
    status      VARCHAR(15) DEFAULT 'requested',
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS cancellation (
    cancellation_id BIGSERIAL PRIMARY KEY,
    booking_id      BIGINT NOT NULL REFERENCES booking(booking_id) ON DELETE CASCADE,
    reason          VARCHAR(200),
    penalty_amount  DECIMAL(14,2) DEFAULT 0,
    refund_amount   DECIMAL(14,2) DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_booking_company ON booking(company_id);
CREATE INDEX IF NOT EXISTS idx_booking_quotation ON booking(quotation_id);
CREATE INDEX IF NOT EXISTS idx_booking_venue_date ON booking(venue_id, event_date);
CREATE INDEX IF NOT EXISTS idx_deposit_booking ON deposit_schedule(booking_id);
