-- BE3-05: manual refund audit on payment attempts. The VNPay refund API stays blocked until
-- sandbox refund permission (G1/D08) is granted, so refunds are recorded after staff completes
-- the actual transfer; status REFUNDED is only set through that explicit confirmation.
ALTER TABLE payment_attempts
    ADD COLUMN refunded_at DATETIME(6) NULL AFTER paid_at,
    ADD COLUMN refunded_by_user_id BIGINT NULL AFTER refunded_at,
    ADD COLUMN refund_note VARCHAR(255) NULL AFTER refunded_by_user_id,
    ADD CONSTRAINT fk_payment_attempts_refunded_by
        FOREIGN KEY (refunded_by_user_id) REFERENCES users (id);
