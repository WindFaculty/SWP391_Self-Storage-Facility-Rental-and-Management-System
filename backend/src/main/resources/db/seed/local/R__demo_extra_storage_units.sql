-- Local catalog expansion: one additional unit of each type at three facilities.
-- Preserve existing units and operator edits when this seed is replayed.
INSERT INTO storage_units (facility_id, unit_type_id, unit_code, location_label, monthly_price, status)
SELECT source.facility_id, source.unit_type_id, additions.new_code,
       source.location_label, source.monthly_price, 'AVAILABLE'
FROM (
    SELECT 'FAC-HAN-01' AS facility_code, 'CG-A02' AS source_code, 'CG-A03' AS new_code
    UNION ALL SELECT 'FAC-HAN-01', 'CG-B01', 'CG-B02'
    UNION ALL SELECT 'FAC-HAN-01', 'CG-C01', 'CG-C02'
    UNION ALL SELECT 'FAC-DAD-01', 'HC-A02', 'HC-A03'
    UNION ALL SELECT 'FAC-DAD-01', 'HC-B01', 'HC-B02'
    UNION ALL SELECT 'FAC-DAD-01', 'HC-C01', 'HC-C02'
    UNION ALL SELECT 'FAC-SGN-02', 'BT-A02', 'BT-A03'
    UNION ALL SELECT 'FAC-SGN-02', 'BT-B01', 'BT-B02'
    UNION ALL SELECT 'FAC-SGN-02', 'BT-C01', 'BT-C02'
) additions
JOIN facilities f ON f.code = additions.facility_code
JOIN storage_units source ON source.facility_id = f.id AND source.unit_code = additions.source_code
WHERE NOT EXISTS (
    SELECT 1 FROM storage_units existing
    WHERE existing.facility_id = f.id AND existing.unit_code = additions.new_code
);
