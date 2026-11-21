-- Local demo catalog. The locations and prices are illustrative.
INSERT IGNORE INTO business_policies (id, deposit_percent, renewal_notice_days, cancellation_fee, return_notice_days, overdue_grace_days, overdue_fee_per_day, max_discount_percent)
VALUES (1, 15.00, 7, 0.00, 7, 3, 50000.00, 10.00);

INSERT IGNORE INTO facilities (code, name, address, status, image_url) VALUES
    ('DEMO-HCM-01', 'Kho tự quản Gò Vấp',
     '12 Nguyễn Văn Bảo, Gò Vấp, TP. Hồ Chí Minh', 'ACTIVE', '/images/facilities/hcm-go-vap.jpg'),
    ('FAC-HAN-01', 'Kho tự quản Cầu Giấy',
     '68 Đường Cầu Giấy, Cầu Giấy, Hà Nội', 'ACTIVE', '/images/facilities/hn-cau-giay.jpg'),
    ('FAC-DAD-01', 'Kho tự quản Hải Châu',
     '120 Nguyễn Văn Linh, Hải Châu, Đà Nẵng', 'ACTIVE', '/images/facilities/dn-hai-chau.jpg'),
    ('FAC-SGN-02', 'Kho tự quản Bình Thạnh',
     '215 Điện Biên Phủ, Bình Thạnh, TP. Hồ Chí Minh', 'ACTIVE', '/images/facilities/hcm-binh-thanh.jpg');

-- Refresh earlier seed text in place, keeping facility IDs and any custom names or addresses.
UPDATE facilities f
JOIN (
    SELECT 'DEMO-HCM-01' AS code, 'Demo Facility - Ho Chi Minh City' AS old_name, 'Kho tự quản Gò Vấp' AS name,
           '12 Nguyen Van Bao, Go Vap, Ho Chi Minh City' AS old_address, '12 Nguyễn Văn Bảo, Gò Vấp, TP. Hồ Chí Minh' AS address
    UNION ALL SELECT 'FAC-HAN-01', 'Cơ sở Cầu Giấy - Hà Nội', 'Kho tự quản Cầu Giấy',
           'Số 68 Đường Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy, Hà Nội', '68 Đường Cầu Giấy, Cầu Giấy, Hà Nội'
    UNION ALL SELECT 'FAC-DAD-01', 'Cơ sở Hải Châu - Đà Nẵng', 'Kho tự quản Hải Châu',
           'Số 120 Đường Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu, Đà Nẵng', '120 Nguyễn Văn Linh, Hải Châu, Đà Nẵng'
    UNION ALL SELECT 'FAC-SGN-02', 'Cơ sở Bình Thạnh - TP. Hồ Chí Minh', 'Kho tự quản Bình Thạnh',
           'Số 215 Đường Điện Biên Phủ, Phường 15, Quận Bình Thạnh, TP. Hồ Chí Minh', '215 Điện Biên Phủ, Bình Thạnh, TP. Hồ Chí Minh'
) demo ON demo.code = f.code
SET f.name = IF(f.name = demo.old_name, demo.name, f.name),
    f.address = IF(f.address = demo.old_address, demo.address, f.address)
WHERE f.name = demo.old_name OR f.address = demo.old_address;

-- NULL can mean an operator deliberately cleared the gallery; do not restore it.
UPDATE facilities SET image_url = '/images/facilities/hcm-go-vap.jpg' WHERE code = 'DEMO-HCM-01' AND image_url LIKE '/images/facilities/%.svg';
UPDATE facilities SET image_url = '/images/facilities/hn-cau-giay.jpg' WHERE code = 'FAC-HAN-01' AND image_url LIKE '/images/facilities/%.svg';
UPDATE facilities SET image_url = '/images/facilities/dn-hai-chau.jpg' WHERE code = 'FAC-DAD-01' AND image_url LIKE '/images/facilities/%.svg';
UPDATE facilities SET image_url = '/images/facilities/hcm-binh-thanh.jpg' WHERE code = 'FAC-SGN-02' AND image_url LIKE '/images/facilities/%.svg';

UPDATE warehouse_images i JOIN facilities f ON f.id = i.facility_id
SET i.legacy_url = f.image_url
WHERE i.legacy_url LIKE '/images/facilities/%.svg' AND f.image_url IS NOT NULL;

INSERT INTO warehouse_images (id, facility_id, legacy_url, sort_order)
SELECT UUID(), f.id, f.image_url, 0 FROM facilities f
WHERE f.image_url IS NOT NULL AND TRIM(f.image_url) <> ''
AND NOT EXISTS (SELECT 1 FROM warehouse_images i WHERE i.facility_id = f.id);

UPDATE unit_types t
JOIN (
    SELECT 'Demo Small (5 m2)' AS old_name, 'Kho nhỏ (5 m²)' AS name,
           'Phù hợp để cất hành lý, hồ sơ, quần áo theo mùa hoặc vài thùng hàng của shop online.' AS description,
           '/images/unit-types/small.jpg' AS image_url
    UNION ALL SELECT 'Demo Medium (12 m2)', 'Kho vừa (12 m²)',
           'Có chỗ cho xe đạp, kệ rời, đồ nội thất nhỏ và các thùng hàng cần lấy thường xuyên.',
           '/images/unit-types/medium.jpg'
    UNION ALL SELECT 'Demo Large (20 m2)', 'Kho lớn (20 m²)',
           'Dành cho đồ nội thất khi chuyển nhà hoặc hàng tồn kho của doanh nghiệp nhỏ, có thể bố trí lối đi giữa các dãy thùng.',
           '/images/unit-types/large.jpg'
) demo ON demo.old_name = t.name
LEFT JOIN unit_types existing ON existing.name = demo.name
SET t.name = demo.name,
    t.description = IF(t.description = 'Demo catalog size - local profile only', demo.description, t.description),
    t.image_url = IF(t.image_url IS NULL OR t.image_url LIKE '/images/unit-types/%.svg', demo.image_url, t.image_url)
WHERE existing.id IS NULL;

INSERT IGNORE INTO unit_types (name, size_m2, min_monthly_price, max_monthly_price, description, image_url) VALUES
    ('Kho nhỏ (5 m²)',   5.00,  500000.00,  800000.00,
     'Phù hợp để cất hành lý, hồ sơ, quần áo theo mùa hoặc vài thùng hàng của shop online.', '/images/unit-types/small.jpg'),
    ('Kho vừa (12 m²)', 12.00, 1200000.00, 1800000.00,
     'Có chỗ cho xe đạp, kệ rời, đồ nội thất nhỏ và các thùng hàng cần lấy thường xuyên.', '/images/unit-types/medium.jpg'),
    ('Kho lớn (20 m²)', 20.00, 2000000.00, 3000000.00,
     'Dành cho đồ nội thất khi chuyển nhà hoặc hàng tồn kho của doanh nghiệp nhỏ, có thể bố trí lối đi giữa các dãy thùng.', '/images/unit-types/large.jpg');

INSERT IGNORE INTO storage_units (facility_id, unit_type_id, unit_code, location_label, monthly_price, status)
SELECT f.id, t.id, demo.unit_code, demo.location_label, demo.monthly_price, 'AVAILABLE'
FROM (
    SELECT 'DEMO-HCM-01' AS facility_code, 'A-01' AS unit_code, 'Kho nhỏ (5 m²)' AS unit_type,
           'Khu A, Tầng trệt' AS location_label, 650000.00 AS monthly_price
    UNION ALL SELECT 'DEMO-HCM-01', 'A-02', 'Kho nhỏ (5 m²)',  'Khu A, Tầng trệt', 650000.00
    UNION ALL SELECT 'DEMO-HCM-01', 'B-01', 'Kho vừa (12 m²)', 'Khu B, Tầng 1',   1500000.00
    UNION ALL SELECT 'DEMO-HCM-01', 'C-01', 'Kho lớn (20 m²)', 'Khu C, Tầng 2',   2500000.00
    UNION ALL SELECT 'FAC-HAN-01', 'CG-A01', 'Kho nhỏ (5 m²)',  'Khu A, Tầng 1',  700000.00
    UNION ALL SELECT 'FAC-HAN-01', 'CG-A02', 'Kho nhỏ (5 m²)',  'Khu A, Tầng 1',  700000.00
    UNION ALL SELECT 'FAC-HAN-01', 'CG-B01', 'Kho vừa (12 m²)', 'Khu B, Tầng 2', 1600000.00
    UNION ALL SELECT 'FAC-HAN-01', 'CG-C01', 'Kho lớn (20 m²)', 'Khu C, Tầng 2', 2500000.00
    UNION ALL SELECT 'FAC-DAD-01', 'HC-A01', 'Kho nhỏ (5 m²)',  'Khu A, Tầng trệt', 550000.00
    UNION ALL SELECT 'FAC-DAD-01', 'HC-A02', 'Kho nhỏ (5 m²)',  'Khu A, Tầng trệt', 550000.00
    UNION ALL SELECT 'FAC-DAD-01', 'HC-B01', 'Kho vừa (12 m²)', 'Khu B, Tầng 1',   1350000.00
    UNION ALL SELECT 'FAC-DAD-01', 'HC-C01', 'Kho lớn (20 m²)', 'Khu C, Tầng 1',   2200000.00
    UNION ALL SELECT 'FAC-SGN-02', 'BT-A01', 'Kho nhỏ (5 m²)',  'Khu A, Tầng 1',  650000.00
    UNION ALL SELECT 'FAC-SGN-02', 'BT-A02', 'Kho nhỏ (5 m²)',  'Khu A, Tầng 1',  650000.00
    UNION ALL SELECT 'FAC-SGN-02', 'BT-B01', 'Kho vừa (12 m²)', 'Khu B, Tầng 1', 1500000.00
    UNION ALL SELECT 'FAC-SGN-02', 'BT-C01', 'Kho lớn (20 m²)', 'Khu C, Tầng 2', 2600000.00
) demo
JOIN facilities f ON f.code = demo.facility_code
JOIN unit_types t ON t.name = demo.unit_type
ORDER BY f.id, demo.unit_code;

UPDATE storage_units u JOIN facilities f ON f.id = u.facility_id
SET u.location_label = CASE u.location_label
    WHEN 'Block A, ground floor' THEN 'Khu A, Tầng trệt'
    WHEN 'Block B, first floor' THEN 'Khu B, Tầng 1'
    WHEN 'Block C, second floor' THEN 'Khu C, Tầng 2'
END
WHERE f.code = 'DEMO-HCM-01'
AND u.unit_code IN ('A-01', 'A-02', 'B-01', 'C-01')
AND u.location_label IN ('Block A, ground floor', 'Block B, first floor', 'Block C, second floor');
