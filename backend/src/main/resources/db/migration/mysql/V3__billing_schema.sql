-- BE3 module (billing): payment attempts. business_policies, fee_types and invoices
-- already ship in V001__baseline_schema.sql (merged BE1 schema).
-- Depends on foundation (users, facilities) and rental (rentals, rental_renewals) migrations.

CREATE TABLE payment_attempts (
    id                 BIGINT        NOT NULL AUTO_INCREMENT,
    invoice_id         BIGINT        NOT NULL,
    amount             DECIMAL(14,2) NOT NULL,
    method             VARCHAR(30)   NOT NULL,
    provider_reference VARCHAR(120)  NULL,
    status             VARCHAR(12)   NOT NULL DEFAULT 'PENDING',
    paid_at            DATETIME(6)   NULL,
    created_at         DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    -- ponytail: MySQL has no partial unique index; generated column emulates "one SUCCESS per invoice".
    success_invoice_id BIGINT GENERATED ALWAYS AS (CASE WHEN status = 'SUCCESS' THEN invoice_id END) STORED,
    CONSTRAINT pk_payment_attempts PRIMARY KEY (id),
    CONSTRAINT ck_payment_attempts_amount CHECK (amount > 0),
    CONSTRAINT ck_payment_attempts_status CHECK (status IN ('PENDING','SUCCESS','FAILED','REFUNDED')),
    CONSTRAINT fk_payment_attempts_invoice FOREIGN KEY (invoice_id) REFERENCES invoices (id),
    CONSTRAINT uq_payment_attempts_reference UNIQUE (provider_reference),
    CONSTRAINT uq_payment_attempts_one_success UNIQUE (success_invoice_id)
) ENGINE = InnoDB;

CREATE INDEX ix_payment_attempts_invoice ON payment_attempts (invoice_id);
