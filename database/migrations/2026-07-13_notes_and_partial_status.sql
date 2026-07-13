-- Migration: debit-note support + Partial invoice status
-- Date: 2026-07-13
-- Run against: Neon production DB (already applied to local eventhub_local)

-- 1. credit_note table now stores both credit and debit notes
ALTER TABLE credit_note ADD COLUMN IF NOT EXISTS note_type varchar(6) NOT NULL DEFAULT 'credit';

-- 2. Recording a partial payment now sets invoice status to 'Partial'
ALTER TABLE invoice DROP CONSTRAINT invoice_status_check;
ALTER TABLE invoice ADD CONSTRAINT invoice_status_check
  CHECK (status::text = ANY (ARRAY['Draft','Issued','Partial','Paid','Overdue','Cancelled']::text[]));
