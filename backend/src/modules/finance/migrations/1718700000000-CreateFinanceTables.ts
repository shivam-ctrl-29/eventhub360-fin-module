import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Module 12 — Finance & Accounting
 * Table names, column names, PKs, and relationships follow the official
 * EventHub360 Database Schema & Architecture document (v1.0 Baseline).
 *
 * Convention (from Global Design Conventions):
 *   - PK  : BIGSERIAL named <table>_id
 *   - Money: DECIMAL(14,2) — never FLOAT
 *   - Time : TIMESTAMPTZ (UTC)
 *   - Standard cols on every tenant-scoped table:
 *       tenant_id, company_id, branch_id,
 *       created_at, updated_at, created_by, updated_by, is_active
 *   - Soft-delete via is_active = false (never hard-delete)
 */
export class CreateFinanceTables1718700000000 implements MigrationInterface {
  name = 'CreateFinanceTables1718700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {

    /* ───────────────────────────────────────────────────────────────
       FOUNDATION STUBS
       The real foundation tables (tenant, company, branch, user_account,
       tax_rule) are owned by Module 0.  We create lightweight local
       stubs here so foreign-key constraints resolve during local dev.
       On the shared DB (eventhub_demo) the supervisor's pgAdmin script
       creates the real tables first — these stubs are skipped due to
       IF NOT EXISTS.
    ─────────────────────────────────────────────────────────────── */
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tenant (
        tenant_id   BIGSERIAL PRIMARY KEY,
        name        VARCHAR(150),
        subdomain   VARCHAR(80) UNIQUE,
        plan        VARCHAR(20),
        status      VARCHAR(15) DEFAULT 'active',
        is_active   BOOLEAN DEFAULT true
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS company (
        company_id    BIGSERIAL PRIMARY KEY,
        tenant_id     BIGINT REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
        name          VARCHAR(150),
        gstin         VARCHAR(15),
        pan           VARCHAR(10),
        base_currency CHAR(3) DEFAULT 'INR'
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS branch (
        branch_id  BIGSERIAL PRIMARY KEY,
        company_id BIGINT REFERENCES company(company_id) ON DELETE RESTRICT,
        name       VARCHAR(120),
        city       VARCHAR(80)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_account (
        user_id       BIGSERIAL PRIMARY KEY,
        tenant_id     BIGINT REFERENCES tenant(tenant_id),
        company_id    BIGINT REFERENCES company(company_id),
        email         VARCHAR(160) UNIQUE,
        password_hash VARCHAR(255),
        full_name     VARCHAR(120),
        phone         VARCHAR(20),
        mfa_enabled   BOOLEAN DEFAULT false,
        status        VARCHAR(15) DEFAULT 'active'
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tax_rule (
        tax_rule_id BIGSERIAL PRIMARY KEY,
        company_id  BIGINT REFERENCES company(company_id) ON DELETE RESTRICT,
        name        VARCHAR(60),
        cgst_pct    DECIMAL(5,2) DEFAULT 0,
        sgst_pct    DECIMAL(5,2) DEFAULT 0,
        igst_pct    DECIMAL(5,2) DEFAULT 0,
        hsn_sac     VARCHAR(12)
      );
    `);

    /* Seed one default tenant / company / branch / user for local testing */
    await queryRunner.query(`
      INSERT INTO tenant  (name, subdomain, plan, status)
        VALUES ('EventHub Demo', 'demo', 'Enterprise', 'active')
        ON CONFLICT DO NOTHING;
    `);
    await queryRunner.query(`
      INSERT INTO company (tenant_id, name, gstin, pan, base_currency)
        VALUES (1, 'Demo Events Pvt Ltd', '27AABCU9603R1ZM', 'AABCU9603R', 'INR')
        ON CONFLICT DO NOTHING;
    `);
    await queryRunner.query(`
      INSERT INTO branch  (company_id, name, city)
        VALUES (1, 'Mumbai HQ', 'Mumbai'), (1, 'Delhi Office', 'Delhi')
        ON CONFLICT DO NOTHING;
    `);
    await queryRunner.query(`
      INSERT INTO user_account (tenant_id, company_id, email, password_hash, full_name, status)
        VALUES (1, 1, 'admin@demo.in', '$2b$10$placeholder', 'System Admin', 'active')
        ON CONFLICT DO NOTHING;
    `);
    await queryRunner.query(`
      INSERT INTO tax_rule (company_id, name, cgst_pct, sgst_pct, igst_pct, hsn_sac)
        VALUES
          (1, 'GST 18%',  9.00,  9.00,  0.00, '998313'),
          (1, 'GST 12%',  6.00,  6.00,  0.00, '998315'),
          (1, 'GST 5%',   2.50,  2.50,  0.00, '998312'),
          (1, 'IGST 18%', 0.00,  0.00, 18.00, '998313'),
          (1, 'GST 0%',   0.00,  0.00,  0.00, '998310')
        ON CONFLICT DO NOTHING;
    `);

    /* ───────────────────────────────────────────────────────────────
       MODULE 12 — FINANCE & ACCOUNTING TABLES
       Source: EventHub360 Database Schema & Architecture doc, pages 46–49
    ─────────────────────────────────────────────────────────────── */

    /* invoice — A receivable document (Proforma / Tax invoice) */
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS invoice (
        invoice_id  BIGSERIAL     PRIMARY KEY,
        tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id)   ON DELETE RESTRICT,
        company_id  BIGINT NOT NULL REFERENCES company(company_id)  ON DELETE RESTRICT,
        branch_id   BIGINT          REFERENCES branch(branch_id)   ON DELETE RESTRICT,
        booking_id  BIGINT,                           -- cross-module FK → booking.booking_id
        invoice_no  VARCHAR(30) UNIQUE NOT NULL,      -- e.g. INV-2026-0001
        type        VARCHAR(12) NOT NULL DEFAULT 'Tax'
                      CHECK (type IN ('Proforma','Tax')),
        subtotal    DECIMAL(14,2) NOT NULL,
        tax_total   DECIMAL(14,2) NOT NULL DEFAULT 0,
        total       DECIMAL(14,2) NOT NULL,
        balance     DECIMAL(14,2) NOT NULL,            -- amount still due
        status      VARCHAR(12) NOT NULL DEFAULT 'Draft'
                      CHECK (status IN ('Draft','Issued','Paid','Overdue','Cancelled')),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by  BIGINT REFERENCES user_account(user_id),
        updated_by  BIGINT REFERENCES user_account(user_id),
        is_active   BOOLEAN NOT NULL DEFAULT true
      );
    `);

    /* invoice_line — A billed line item on an invoice */
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS invoice_line (
        invoice_line_id BIGSERIAL     PRIMARY KEY,
        tenant_id       BIGINT NOT NULL REFERENCES tenant(tenant_id)    ON DELETE RESTRICT,
        company_id      BIGINT NOT NULL REFERENCES company(company_id)   ON DELETE RESTRICT,
        branch_id       BIGINT          REFERENCES branch(branch_id)    ON DELETE RESTRICT,
        invoice_id      BIGINT NOT NULL REFERENCES invoice(invoice_id)  ON DELETE CASCADE,
        description     VARCHAR(200) NOT NULL,
        qty             DECIMAL(10,2) NOT NULL DEFAULT 1  CHECK (qty > 0),
        rate            DECIMAL(14,2) NOT NULL             CHECK (rate >= 0),
        amount          DECIMAL(14,2) NOT NULL,            -- qty × rate (pre-tax)
        tax_rule_id     BIGINT REFERENCES tax_rule(tax_rule_id) ON DELETE RESTRICT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by  BIGINT REFERENCES user_account(user_id),
        updated_by  BIGINT REFERENCES user_account(user_id),
        is_active   BOOLEAN NOT NULL DEFAULT true
      );
    `);

    /* payment — Money received against an invoice (instalment-friendly) */
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS payment (
        payment_id  BIGSERIAL     PRIMARY KEY,
        tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id)    ON DELETE RESTRICT,
        company_id  BIGINT NOT NULL REFERENCES company(company_id)   ON DELETE RESTRICT,
        branch_id   BIGINT          REFERENCES branch(branch_id)    ON DELETE RESTRICT,
        invoice_id  BIGINT NOT NULL REFERENCES invoice(invoice_id)  ON DELETE RESTRICT,
        mode        VARCHAR(15) NOT NULL
                      CHECK (mode IN ('UPI','Card','Bank','Cash','Cheque')),
        amount      DECIMAL(14,2) NOT NULL CHECK (amount > 0),
        gateway_ref VARCHAR(60),                      -- UTR / cheque no / txn ref for ≥95% auto-reconciliation
        paid_at     TIMESTAMPTZ NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by  BIGINT REFERENCES user_account(user_id),
        updated_by  BIGINT REFERENCES user_account(user_id),
        is_active   BOOLEAN NOT NULL DEFAULT true
      );
    `);

    /* expense — An incurred operational cost linked to an event */
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS expense (
        expense_id  BIGSERIAL     PRIMARY KEY,
        tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id)    ON DELETE RESTRICT,
        company_id  BIGINT NOT NULL REFERENCES company(company_id)   ON DELETE RESTRICT,
        branch_id   BIGINT          REFERENCES branch(branch_id)    ON DELETE RESTRICT,
        event_id    BIGINT,                           -- cross-module FK → event.event_id (nullable)
        category    VARCHAR(40) NOT NULL,
        description TEXT,
        amount      DECIMAL(14,2) NOT NULL CHECK (amount > 0),
        receipt_url TEXT,
        status      VARCHAR(15) NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','approved','rejected','reimbursed')),
        approved_by BIGINT REFERENCES user_account(user_id),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by  BIGINT REFERENCES user_account(user_id),
        updated_by  BIGINT REFERENCES user_account(user_id),
        is_active   BOOLEAN NOT NULL DEFAULT true
      );
    `);

    /* payout — A payment made to a vendor / driver */
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS payout (
        payout_id         BIGSERIAL     PRIMARY KEY,
        tenant_id         BIGINT NOT NULL REFERENCES tenant(tenant_id)   ON DELETE RESTRICT,
        company_id        BIGINT NOT NULL REFERENCES company(company_id)  ON DELETE RESTRICT,
        branch_id         BIGINT          REFERENCES branch(branch_id)   ON DELETE RESTRICT,
        vendor_invoice_id BIGINT,                     -- cross-module FK → vendor module
        amount            DECIMAL(14,2) NOT NULL CHECK (amount > 0),
        status            VARCHAR(15) NOT NULL DEFAULT 'scheduled'
                            CHECK (status IN ('scheduled','approved','paid')),
        scheduled_date    DATE,
        paid_at           TIMESTAMPTZ,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by  BIGINT REFERENCES user_account(user_id),
        updated_by  BIGINT REFERENCES user_account(user_id),
        is_active   BOOLEAN NOT NULL DEFAULT true
      );
    `);

    /* credit_note — A credit / adjustment document (GST-compliant correction) */
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS credit_note (
        credit_note_id BIGSERIAL     PRIMARY KEY,
        tenant_id      BIGINT NOT NULL REFERENCES tenant(tenant_id)    ON DELETE RESTRICT,
        company_id     BIGINT NOT NULL REFERENCES company(company_id)   ON DELETE RESTRICT,
        branch_id      BIGINT          REFERENCES branch(branch_id)    ON DELETE RESTRICT,
        invoice_id     BIGINT NOT NULL REFERENCES invoice(invoice_id)  ON DELETE RESTRICT,
        amount         DECIMAL(14,2) NOT NULL CHECK (amount > 0),
        reason         VARCHAR(160) NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by  BIGINT REFERENCES user_account(user_id),
        updated_by  BIGINT REFERENCES user_account(user_id),
        is_active   BOOLEAN NOT NULL DEFAULT true
      );
    `);

    /* pnl — Per-event profit & loss rollup (1:1 with event) */
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS pnl (
        pnl_id      BIGSERIAL     PRIMARY KEY,
        tenant_id   BIGINT NOT NULL REFERENCES tenant(tenant_id)    ON DELETE RESTRICT,
        company_id  BIGINT NOT NULL REFERENCES company(company_id)   ON DELETE RESTRICT,
        branch_id   BIGINT          REFERENCES branch(branch_id)    ON DELETE RESTRICT,
        event_id    BIGINT UNIQUE,                    -- cross-module FK → event.event_id (1:1)
        revenue     DECIMAL(14,2) NOT NULL DEFAULT 0, -- total billed via invoices
        direct_cost DECIMAL(14,2) NOT NULL DEFAULT 0, -- sum of POs + expenses
        margin      DECIMAL(14,2) GENERATED ALWAYS AS (revenue - direct_cost) STORED,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by  BIGINT REFERENCES user_account(user_id),
        updated_by  BIGINT REFERENCES user_account(user_id),
        is_active   BOOLEAN NOT NULL DEFAULT true
      );
    `);

    /* ── Performance indexes ── */
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_invoice_company    ON invoice(company_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_invoice_status     ON invoice(status) WHERE is_active;`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_invoice_booking    ON invoice(booking_id) WHERE booking_id IS NOT NULL;`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_inv_line_invoice   ON invoice_line(invoice_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_payment_invoice    ON payment(invoice_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_payment_paid_at    ON payment(paid_at DESC);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_expense_company    ON expense(company_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_expense_status     ON expense(status) WHERE is_active;`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_expense_event      ON expense(event_id) WHERE event_id IS NOT NULL;`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_payout_status      ON payout(status) WHERE is_active;`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_credit_note_inv    ON credit_note(invoice_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_pnl_event          ON pnl(event_id) WHERE event_id IS NOT NULL;`);

    /* ── Auto-update updated_at trigger ── */
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION fin_set_updated_at()
      RETURNS TRIGGER LANGUAGE plpgsql AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END; $$;
    `);

    for (const tbl of ['invoice','invoice_line','payment','expense','payout','credit_note','pnl']) {
      await queryRunner.query(`
        DROP TRIGGER IF EXISTS trg_${tbl}_updated_at ON ${tbl};
        CREATE TRIGGER trg_${tbl}_updated_at
          BEFORE UPDATE ON ${tbl}
          FOR EACH ROW EXECUTE FUNCTION fin_set_updated_at();
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP FUNCTION IF EXISTS fin_set_updated_at CASCADE;`);
    for (const tbl of ['pnl','credit_note','payout','expense','payment','invoice_line','invoice']) {
      await queryRunner.query(`DROP TABLE IF EXISTS ${tbl} CASCADE;`);
    }
    for (const tbl of ['tax_rule','user_account','branch','company','tenant']) {
      await queryRunner.query(`DROP TABLE IF EXISTS ${tbl} CASCADE;`);
    }
  }
}
