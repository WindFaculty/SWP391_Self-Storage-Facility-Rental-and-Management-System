-- =============================================================================
-- R__ repeatable demo seed - LOCAL PROFILE ONLY.
-- Enabled via spring.flyway.locations in application-local.yml
-- (classpath:db/seed/local); staging/production never load this location.
--
-- Rules:
--   * INSERT IGNORE + unique keys: operator edits are never overwritten.
--   * Repeated on every checksum change; must stay idempotent.
--   * Catalog prices below are placeholders for local UI development only.
-- =============================================================================

INSERT IGNORE INTO business_policies (id, deposit_percent, renewal_notice_days, cancellation_fee, return_notice_days, overdue_grace_days, overdue_fee_per_day, max_discount_percent)
VALUES (1, 15.00, 7, 0.00, 7, 3, 50000.00, 10.00);

INSERT IGNORE INTO facilities (code, name, address, status) VALUES
    ('DEMO-HCM-01', 'Demo Facility - Ho Chi Minh City',
     '12 Nguyen Van Bao, Go Vap, Ho Chi Minh City', 'ACTIVE'),
    ('FAC-HAN-01', 'Cơ sở Cầu Giấy - Hà Nội',
     'Số 68 Đường Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy, Hà Nội', 'ACTIVE'),
    ('FAC-DAD-01', 'Cơ sở Hải Châu - Đà Nẵng',
     'Số 120 Đường Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu, Đà Nẵng', 'ACTIVE'),
    ('FAC-SGN-02', 'Cơ sở Bình Thạnh - TP. Hồ Chí Minh',
     'Số 215 Đường Điện Biên Phủ, Phường 15, Quận Bình Thạnh, TP. Hồ Chí Minh', 'ACTIVE');

INSERT IGNORE INTO unit_types (name, size_m2, min_monthly_price, max_monthly_price, description) VALUES
    ('Demo Small (5 m2)',   5.00,  500000.00,  800000.00, 'Demo catalog size - local profile only'),
    ('Demo Medium (12 m2)', 12.00, 1200000.00, 1800000.00, 'Demo catalog size - local profile only'),
    ('Demo Large (20 m2)',  20.00, 2000000.00, 3000000.00, 'Demo catalog size - local profile only');

-- DEMO-HCM-01 (Gò Vấp)
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

INSERT IGNORE INTO storage_units (facility_id, unit_type_id, unit_code, location_label, monthly_price, status)
SELECT f.id, t.id, 'C-01', 'Block C, second floor', 2500000.00, 'AVAILABLE'
FROM facilities f
JOIN unit_types t ON t.name = 'Demo Large (20 m2)'
WHERE f.code = 'DEMO-HCM-01';

-- FAC-HAN-01 (Cầu Giấy - Hà Nội)
INSERT IGNORE INTO storage_units (facility_id, unit_type_id, unit_code, location_label, monthly_price, status)
SELECT f.id, t.id, 'CG-A01', 'Khu A, Tầng 1', 700000.00, 'AVAILABLE'
FROM facilities f
JOIN unit_types t ON t.name = 'Demo Small (5 m2)'
WHERE f.code = 'FAC-HAN-01';

INSERT IGNORE INTO storage_units (facility_id, unit_type_id, unit_code, location_label, monthly_price, status)
SELECT f.id, t.id, 'CG-A02', 'Khu A, Tầng 1', 700000.00, 'AVAILABLE'
FROM facilities f
JOIN unit_types t ON t.name = 'Demo Small (5 m2)'
WHERE f.code = 'FAC-HAN-01';

INSERT IGNORE INTO storage_units (facility_id, unit_type_id, unit_code, location_label, monthly_price, status)
SELECT f.id, t.id, 'CG-B01', 'Khu B, Tầng 2', 1600000.00, 'AVAILABLE'
FROM facilities f
JOIN unit_types t ON t.name = 'Demo Medium (12 m2)'
WHERE f.code = 'FAC-HAN-01';

INSERT IGNORE INTO storage_units (facility_id, unit_type_id, unit_code, location_label, monthly_price, status)
SELECT f.id, t.id, 'CG-C01', 'Khu C, Tầng 2', 2500000.00, 'AVAILABLE'
FROM facilities f
JOIN unit_types t ON t.name = 'Demo Large (20 m2)'
WHERE f.code = 'FAC-HAN-01';

-- FAC-DAD-01 (Hải Châu - Đà Nẵng)
INSERT IGNORE INTO storage_units (facility_id, unit_type_id, unit_code, location_label, monthly_price, status)
SELECT f.id, t.id, 'HC-A01', 'Khu A, Tầng trệt', 550000.00, 'AVAILABLE'
FROM facilities f
JOIN unit_types t ON t.name = 'Demo Small (5 m2)'
WHERE f.code = 'FAC-DAD-01';

INSERT IGNORE INTO storage_units (facility_id, unit_type_id, unit_code, location_label, monthly_price, status)
SELECT f.id, t.id, 'HC-A02', 'Khu A, Tầng trệt', 550000.00, 'AVAILABLE'
FROM facilities f
JOIN unit_types t ON t.name = 'Demo Small (5 m2)'
WHERE f.code = 'FAC-DAD-01';

INSERT IGNORE INTO storage_units (facility_id, unit_type_id, unit_code, location_label, monthly_price, status)
SELECT f.id, t.id, 'HC-B01', 'Khu B, Tầng 1', 1350000.00, 'AVAILABLE'
FROM facilities f
JOIN unit_types t ON t.name = 'Demo Medium (12 m2)'
WHERE f.code = 'FAC-DAD-01';

INSERT IGNORE INTO storage_units (facility_id, unit_type_id, unit_code, location_label, monthly_price, status)
SELECT f.id, t.id, 'HC-C01', 'Khu C, Tầng 1', 2200000.00, 'AVAILABLE'
FROM facilities f
JOIN unit_types t ON t.name = 'Demo Large (20 m2)'
WHERE f.code = 'FAC-DAD-01';

-- FAC-SGN-02 (Bình Thạnh - TP. Hồ Chí Minh)
INSERT IGNORE INTO storage_units (facility_id, unit_type_id, unit_code, location_label, monthly_price, status)
SELECT f.id, t.id, 'BT-A01', 'Khu A, Tầng 1', 650000.00, 'AVAILABLE'
FROM facilities f
JOIN unit_types t ON t.name = 'Demo Small (5 m2)'
WHERE f.code = 'FAC-SGN-02';

INSERT IGNORE INTO storage_units (facility_id, unit_type_id, unit_code, location_label, monthly_price, status)
SELECT f.id, t.id, 'BT-A02', 'Khu A, Tầng 1', 650000.00, 'AVAILABLE'
FROM facilities f
JOIN unit_types t ON t.name = 'Demo Small (5 m2)'
WHERE f.code = 'FAC-SGN-02';

INSERT IGNORE INTO storage_units (facility_id, unit_type_id, unit_code, location_label, monthly_price, status)
SELECT f.id, t.id, 'BT-B01', 'Khu B, Tầng 1', 1500000.00, 'AVAILABLE'
FROM facilities f
JOIN unit_types t ON t.name = 'Demo Medium (12 m2)'
WHERE f.code = 'FAC-SGN-02';

INSERT IGNORE INTO storage_units (facility_id, unit_type_id, unit_code, location_label, monthly_price, status)
SELECT f.id, t.id, 'BT-C01', 'Khu C, Tầng 2', 2600000.00, 'AVAILABLE'
FROM facilities f
JOIN unit_types t ON t.name = 'Demo Large (20 m2)'
WHERE f.code = 'FAC-SGN-02';
