-- Local development accounts only. All use password Demo12345! (BCrypt).
-- Existing accounts are never overwritten when this seed runs again.
INSERT IGNORE INTO users (full_name, email, password_hash, role, status)
VALUES
    ('Demo Customer', 'customer@demo.local', '$2a$10$OBBrTvgKWLQeGjshMSK/A.c04VT5q2/tBEE7F9/PVbVt.8xoNW8Da', 'CUSTOMER', 'ACTIVE'),
    ('Demo Admin', 'admin@demo.local', '$2a$10$OBBrTvgKWLQeGjshMSK/A.c04VT5q2/tBEE7F9/PVbVt.8xoNW8Da', 'ADMIN', 'ACTIVE');

INSERT IGNORE INTO users (facility_id, full_name, email, password_hash, role, status)
SELECT id, 'Demo Facility Manager', 'manager@demo.local',
       '$2a$10$OBBrTvgKWLQeGjshMSK/A.c04VT5q2/tBEE7F9/PVbVt.8xoNW8Da', 'FACILITY_MANAGER', 'ACTIVE'
FROM facilities WHERE code = 'DEMO-HCM-01';
