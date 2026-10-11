-- =============================================================================
-- R__ repeatable demo seed - LOCAL PROFILE ONLY.
-- Enabled via spring.flyway.locations in application-local.yml
-- (classpath:db/seed/local); staging/production never load this location.
--
-- Rules:
--   * No real business policy values (deposit %, fees, grace periods).
--   * INSERT IGNORE + unique keys: operator edits are never overwritten.
--   * Repeated on every checksum change; must stay idempotent.
--   * Catalog prices below are placeholders for local UI development only.
-- =============================================================================

INSERT IGNORE INTO facilities (code, name, address, status) VALUES
    ('DEMO-HCM-01', 'Demo Facility - Ho Chi Minh City',
     '12 Nguyen Van Bao, Go Vap, Ho Chi Minh City', 'ACTIVE');

INSERT IGNORE INTO unit_types (name, size_m2, min_monthly_price, max_monthly_price, description) VALUES
    ('Demo Small (5 m2)',   5.00,  500000.00,  800000.00, 'Demo catalog size - local profile only'),
    ('Demo Medium (12 m2)', 12.00, 1200000.00, 1800000.00, 'Demo catalog size - local profile only');

INSERT IGNORE INTO storage_units (facility_id, unit_type_id, unit_code, location_label, monthly_price, status)
SELECT f.id, t.id, 'A-01', 'Block A, ground floor', 650000.00, 'AVAILABLE'
FROM facilities f
JOIN unit_types t ON t.name = 'Demo Small (5 m2)'
WHERE f.code = 'DEMO-HCM-01';

INSERT IGNORE INTO storage_units (facility_id, unit_type_id, unit_code, location_label, monthly_price, status)
SELECT f.id, t.id, 'A-02', 'Block A, ground floor', 650000.00, 'AVAILABLE'
FROM facilities f
JOIN unit_types t ON t.name = 'Demo Small (5 m2)'
WHERE f.code = 'DEMO-HCM-01';

INSERT IGNORE INTO storage_units (facility_id, unit_type_id, unit_code, location_label, monthly_price, status)
SELECT f.id, t.id, 'B-01', 'Block B, first floor', 1500000.00, 'AVAILABLE'
FROM facilities f
JOIN unit_types t ON t.name = 'Demo Medium (12 m2)'
WHERE f.code = 'DEMO-HCM-01';
