-- Keep the initial unit photos in their own repeatable seed. Regular catalog changes
-- do not rerun this file or restore images that an operator has removed.
INSERT INTO warehouse_images (id, storage_unit_id, legacy_url, sort_order)
SELECT UUID(), u.id, t.image_url, 0
FROM storage_units u
JOIN facilities f ON f.id = u.facility_id
JOIN unit_types t ON t.id = u.unit_type_id
WHERE (
    (f.code = 'DEMO-HCM-01' AND u.unit_code IN ('A-01', 'A-02', 'B-01', 'C-01'))
    OR (f.code = 'FAC-HAN-01' AND u.unit_code IN ('CG-A01', 'CG-A02', 'CG-A03', 'CG-B01', 'CG-B02', 'CG-C01', 'CG-C02'))
    OR (f.code = 'FAC-DAD-01' AND u.unit_code IN ('HC-A01', 'HC-A02', 'HC-A03', 'HC-B01', 'HC-B02', 'HC-C01', 'HC-C02'))
    OR (f.code = 'FAC-SGN-02' AND u.unit_code IN ('BT-A01', 'BT-A02', 'BT-A03', 'BT-B01', 'BT-B02', 'BT-C01', 'BT-C02'))
)
AND t.image_url IN ('/images/unit-types/small.jpg', '/images/unit-types/medium.jpg', '/images/unit-types/large.jpg')
AND NOT EXISTS (SELECT 1 FROM warehouse_images i WHERE i.storage_unit_id = u.id);
