-- BE3-04: gateway transaction number on payment attempts (audit, querydr, refund).
ALTER TABLE payment_attempts
    ADD COLUMN gateway_transaction_no VARCHAR(120) NULL AFTER provider_reference;
