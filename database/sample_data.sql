-- ============================================================
--  EventHub 360 — Module 12: Finance & Accounting
--  Sample / Demo Data
--  Run AFTER fin_module_schema.sql, as the app user or superuser.
--  Safe to re-run: uses guards / ON CONFLICT where possible.
-- ============================================================

-- ── Tax rules (GST slabs) ──
INSERT INTO tax_rule (company_id, name, cgst_pct, sgst_pct, igst_pct, hsn_sac) VALUES
  (1, 'GST 0%',  0,   0,   0,  '998596'),
  (1, 'GST 5%',  2.5, 2.5, 5,  '998596'),
  (1, 'GST 12%', 6,   6,   12, '998596'),
  (1, 'GST 18%', 9,   9,   18, '998596'),
  (1, 'GST 28%', 14,  14,  28, '998596')
ON CONFLICT DO NOTHING;

-- ── Invoices (mix of Draft / Issued / Paid; varied ages for aging & dunning) ──
INSERT INTO invoice (tenant_id, company_id, branch_id, invoice_no, type, subtotal, tax_total, total, balance, status, created_by, created_at, updated_at, is_active) VALUES
  (1,1,1,'INV-2026-0001','Tax',150000,27000,177000,177000,'Issued',1, now()-interval '15 days',  now()-interval '15 days',  true),
  (1,1,1,'INV-2026-0002','Tax', 85000,15300,100300,100300,'Issued',1, now()-interval '45 days',  now()-interval '45 days',  true),
  (1,1,1,'INV-2026-0003','Tax',200000,36000,236000,     0,'Paid',  1, now()-interval '60 days',  now()-interval '55 days',  true),
  (1,1,1,'INV-2026-0004','Tax', 60000,10800, 70800, 70800,'Draft', 1, now()-interval '2 days',   now()-interval '2 days',   true),
  (1,1,1,'INV-2026-0010','Tax', 90000,16200,106200,106200,'Issued',1, now()-interval '72 days',  now()-interval '72 days',  true),
  (1,1,1,'INV-2026-0011','Tax', 60000,10800, 70800, 70800,'Issued',1, now()-interval '105 days', now()-interval '105 days', true)
ON CONFLICT (invoice_no) DO NOTHING;

-- ── Payments ──
INSERT INTO payment (tenant_id, company_id, invoice_id, mode, amount, gateway_ref, paid_at, created_by, created_at, updated_at, is_active)
SELECT 1,1, i.invoice_id, 'Bank', 236000, 'UTR20260401123', now()-interval '55 days', 1, now(), now(), true
FROM invoice i WHERE i.invoice_no='INV-2026-0003'
AND NOT EXISTS (SELECT 1 FROM payment p WHERE p.gateway_ref='UTR20260401123');

-- ── Expenses (varied categories + statuses) ──
INSERT INTO expense (tenant_id, company_id, category, description, amount, status, created_by, created_at, updated_at, is_active) VALUES
  (1,1,'venue',         'Grand Hyatt Banquet Hall',     85000, 'approved', 1, now()-interval '20 days', now(), true),
  (1,1,'logistics',     'AV Equipment Rental',          32000, 'approved', 1, now()-interval '18 days', now(), true),
  (1,1,'food_beverage', 'Catering – 200 Pax',           48000, 'pending',  1, now()-interval '5 days',  now(), true),
  (1,1,'travel',        'Team Travel – Mumbai to Delhi',18500, 'pending',  1, now()-interval '3 days',  now(), true),
  (1,1,'decor',         'Floral & Stage Decoration',    27000, 'rejected', 1, now()-interval '30 days', now(), true),
  (1,1,'marketing',     'Social Media Campaign',        15000, 'approved', 1, now()-interval '12 days', now(), true)
ON CONFLICT DO NOTHING;

-- ── Vendor payouts ──
INSERT INTO payout (tenant_id, company_id, amount, status, scheduled_date, created_by, created_at, updated_at, is_active) VALUES
  (1,1, 45000,  'scheduled', now()+interval '5 days',  1, now(), now(), true),
  (1,1, 32000,  'scheduled', now()+interval '10 days', 1, now(), now(), true),
  (1,1, 78000,  'approved',  now()+interval '2 days',  1, now(), now(), true),
  (1,1, 120000, 'paid',      now()-interval '5 days',  1, now(), now(), true)
ON CONFLICT DO NOTHING;

-- ── Credit notes ──
INSERT INTO credit_note (tenant_id, company_id, invoice_id, amount, reason, created_by, created_at, updated_at, is_active)
SELECT 1,1, i.invoice_id, 15000, 'Service cancellation – partial refund', 1, now()-interval '10 days', now(), true
FROM invoice i WHERE i.invoice_no='INV-2026-0003'
AND NOT EXISTS (SELECT 1 FROM credit_note c WHERE c.invoice_id=i.invoice_id AND c.amount=15000);

INSERT INTO credit_note (tenant_id, company_id, invoice_id, amount, reason, created_by, created_at, updated_at, is_active)
SELECT 1,1, i.invoice_id, 8500, 'Billing correction – quantity error', 1, now()-interval '5 days', now(), true
FROM invoice i WHERE i.invoice_no='INV-2026-0004'
AND NOT EXISTS (SELECT 1 FROM credit_note c WHERE c.invoice_id=i.invoice_id AND c.amount=8500);

-- ── Vendor bills (Accounts Payable) ──
INSERT INTO vendor_bill (vendor_name, bill_number, category, amount, gst_amount, total_amount, bill_date, due_date, status) VALUES
  ('Sound & Stage Co.', 'VB-2026-001', 'logistics',     80000, 14400,  94400, now()-interval '10 days', now()+interval '5 days',  'pending'),
  ('Bloom Decorators',  'VB-2026-002', 'decor',         45000,  8100,  53100, now()-interval '20 days', now()-interval '2 days',  'pending'),
  ('Gourmet Caterers',  'VB-2026-003', 'food_beverage',120000,  6000, 126000, now()-interval '5 days',  now()+interval '15 days', 'approved')
ON CONFLICT DO NOTHING;

-- ── Per-event P&L ──
INSERT INTO pnl (tenant_id, company_id, branch_id, event_id, revenue, direct_cost, created_by) VALUES
  (1,1,1, 101, 250000, 160000, 1),
  (1,1,1, 102, 180000, 120000, 1),
  (1,1,1, 103, 320000, 210000, 1)
ON CONFLICT (event_id) DO NOTHING;
