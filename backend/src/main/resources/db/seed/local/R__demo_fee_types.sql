-- Local demo extra fee types for OperationsPoliciesPage and extra billing.
INSERT IGNORE INTO fee_types (code, name, default_amount, active)
VALUES
    ('LOST_KEY', 'Phí mất chìa khóa / thẻ từ', 150000.00, 1),
    ('LOCK_REPLACEMENT', 'Phí thay khóa kho', 300000.00, 1),
    ('CLEANING', 'Phí vệ sinh kho sau trả', 200000.00, 1),
    ('ACCESS_CODE_RESET', 'Phí cấp lại mã truy cập', 50000.00, 1);

