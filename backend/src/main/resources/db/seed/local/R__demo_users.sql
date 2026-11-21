-- Local demo sign-ins. Use BCrypt for the shared demo password.
SET @demo_password_hash = '$2a$10$NdvQRW5Etx2GtIFMjX5kM.DSF5Ai9Z0Grv8GFXD2ukCaTjPe//E.O';

-- Refresh the original seed accounts in place so their rental and task links stay intact.
UPDATE users previous
JOIN (
    SELECT 'admin@demo.local' AS old_email, 'admin@gmail.com' AS email, 'Quản trị viên' AS full_name, 'ADMIN' AS role
    UNION ALL SELECT 'business@demo.local', 'khoa@gmail.com', 'Khoa', 'BUSINESS_MANAGER'
    UNION ALL SELECT 'manager@demo.local', 'thien@gmail.com', 'Thiện', 'FACILITY_MANAGER'
    UNION ALL SELECT 'staff@demo.local', 'thanh@gmail.com', 'Thanh', 'FACILITY_STAFF'
    UNION ALL SELECT 'customer@demo.local', 'tinh@gmail.com', 'Tình', 'CUSTOMER'
) demo ON demo.old_email = previous.email AND demo.role = previous.role
LEFT JOIN users existing ON existing.email = demo.email
SET previous.email = demo.email,
    previous.full_name = demo.full_name,
    previous.password_hash = @demo_password_hash
WHERE existing.id IS NULL
  AND previous.password_hash = '$2a$10$OBBrTvgKWLQeGjshMSK/A.c04VT5q2/tBEE7F9/PVbVt.8xoNW8Da';

INSERT IGNORE INTO users (full_name, email, password_hash, role, status)
VALUES
    ('Quản trị viên', 'admin@gmail.com', @demo_password_hash, 'ADMIN', 'ACTIVE'),
    ('Khoa', 'khoa@gmail.com', @demo_password_hash, 'BUSINESS_MANAGER', 'ACTIVE'),
    ('Tình', 'tinh@gmail.com', @demo_password_hash, 'CUSTOMER', 'ACTIVE');

INSERT IGNORE INTO users (facility_id, full_name, email, password_hash, role, status)
SELECT id, 'Thiện', 'thien@gmail.com', @demo_password_hash, 'FACILITY_MANAGER', 'ACTIVE'
FROM facilities WHERE code = 'DEMO-HCM-01';

INSERT IGNORE INTO users (facility_id, full_name, email, password_hash, role, status)
SELECT id, 'Thanh', 'thanh@gmail.com', @demo_password_hash, 'FACILITY_STAFF', 'ACTIVE'
FROM facilities WHERE code = 'DEMO-HCM-01';
