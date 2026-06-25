-- ============================================================
-- STEP 22: SEED DATA - Minimal test data for all modules
-- Run AFTER: All STEP1-STEP21 files
-- ============================================================

-- 1. Tenant
INSERT INTO tenant (name, subdomain) VALUES ('Demo Events Pvt Ltd', 'demo') ON CONFLICT DO NOTHING;

-- 2. Company
INSERT INTO company (tenant_id, name, currency_code)
SELECT t.tenant_id, 'Demo Events HQ', 'INR'
FROM tenant t WHERE t.subdomain = 'demo'
ON CONFLICT DO NOTHING;

-- 3. Location
INSERT INTO location (tenant_id, label, city, country)
SELECT tenant_id, 'Mumbai HQ', 'Mumbai', 'India' FROM tenant WHERE subdomain = 'demo'
ON CONFLICT DO NOTHING;

-- 4. Branch
INSERT INTO branch (tenant_id, company_id, location_id, name)
SELECT c.tenant_id, c.company_id, l.location_id, 'Main Branch'
FROM company c JOIN location l ON l.tenant_id = c.tenant_id
WHERE c.name = 'Demo Events HQ'
ON CONFLICT DO NOTHING;

-- 5. Role
INSERT INTO role (tenant_id, name) VALUES
((SELECT tenant_id FROM tenant WHERE subdomain = 'demo'), 'Admin'),
((SELECT tenant_id FROM tenant WHERE subdomain = 'demo'), 'Manager'),
((SELECT tenant_id FROM tenant WHERE subdomain = 'demo'), 'Finance')
ON CONFLICT DO NOTHING;

-- 6. User Account (password_hash is placeholder - replace with bcrypt hash)
INSERT INTO user_account (tenant_id, company_id, email, password_hash, display_name)
SELECT c.tenant_id, c.company_id, 'admin@demo.com', '$2b$12$placeholder', 'Admin User'
FROM company c WHERE c.name = 'Demo Events HQ'
ON CONFLICT DO NOTHING;

-- 7. Tax Rule
INSERT INTO tax_rule (tenant_id, name, rate_pct, is_compound)
SELECT tenant_id, 'GST 18%', 18.00, FALSE FROM tenant WHERE subdomain = 'demo'
ON CONFLICT DO NOTHING;

-- 8. Numbering Scheme
INSERT INTO numbering_scheme (tenant_id, entity, prefix, next_seq)
SELECT tenant_id, 'quotation', 'QT-', 1 FROM tenant WHERE subdomain = 'demo'
UNION ALL
SELECT tenant_id, 'booking', 'BK-', 1 FROM tenant WHERE subdomain = 'demo'
UNION ALL
SELECT tenant_id, 'invoice', 'INV-', 1 FROM tenant WHERE subdomain = 'demo'
ON CONFLICT DO NOTHING;

-- 9. Venue
INSERT INTO venue (tenant_id, company_id, name, capacity)
SELECT c.tenant_id, c.company_id, 'Grand Ballroom', 500
FROM company c WHERE c.name = 'Demo Events HQ'
ON CONFLICT DO NOTHING;

-- 10. Lead Source
INSERT INTO lead_source (tenant_id, name)
SELECT tenant_id, 'Website' FROM tenant WHERE subdomain = 'demo'
UNION ALL
SELECT tenant_id, 'Referral' FROM tenant WHERE subdomain = 'demo'
ON CONFLICT DO NOTHING;

-- 11. Pipeline Stage
INSERT INTO pipeline_stage (tenant_id, name, stage_order)
SELECT tenant_id, 'New', 1 FROM tenant WHERE subdomain = 'demo'
UNION ALL
SELECT tenant_id, 'Quoted', 2 FROM tenant WHERE subdomain = 'demo'
UNION ALL
SELECT tenant_id, 'Negotiation', 3 FROM tenant WHERE subdomain = 'demo'
UNION ALL
SELECT tenant_id, 'Won', 4 FROM tenant WHERE subdomain = 'demo'
ON CONFLICT DO NOTHING;

-- 12. Plan (White-Label)
INSERT INTO plan (name, price_monthly, user_limit, storage_gb) VALUES
('Starter', 2999.00, 5, 10),
('Growth', 7999.00, 25, 50),
('Enterprise', 19999.00, NULL, 500)
ON CONFLICT DO NOTHING;

-- 13. Master Data (common lookups)
INSERT INTO master_data (tenant_id, domain, code, label, sort_order)
SELECT tenant_id, 'event_type', 'WEDDING', 'Wedding', 1 FROM tenant WHERE subdomain = 'demo'
UNION ALL
SELECT tenant_id, 'event_type', 'CORPORATE', 'Corporate', 2 FROM tenant WHERE subdomain = 'demo'
UNION ALL
SELECT tenant_id, 'event_type', 'BIRTHDAY', 'Birthday', 3 FROM tenant WHERE subdomain = 'demo'
UNION ALL
SELECT tenant_id, 'gender', 'M', 'Male', 1 FROM tenant WHERE subdomain = 'demo'
UNION ALL
SELECT tenant_id, 'gender', 'F', 'Female', 2 FROM tenant WHERE subdomain = 'demo'
ON CONFLICT DO NOTHING;

SELECT 'Seed data inserted successfully.' AS result;
