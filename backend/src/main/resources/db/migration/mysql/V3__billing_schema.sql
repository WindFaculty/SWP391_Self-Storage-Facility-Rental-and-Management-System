-- BE3 module (billing): business policy, fee types, invoices, payment attempts. MySQL 8.4 / InnoDB.
-- Depends on foundation (users, facilities) and rental (rentals, rental_renewals) migrations.
-- ponytail: version slot is provisional until BE1 freezes the Flyway sequence; nothing merged yet.

CREATE TABLE business_policies (
    id                   SMALLINT      NOT NULL,
    deposit_percent      DECIMAL(5,2)  NOT NULL,
    renewal_notice_days  INT           NOT NULL,
    cancellation_fee     DECIMAL(14,2) NOT NULL,
    return_notice_days   INT           NOT NULL,
    overdue_grace_days   INT           NOT NULL,
    overdue_fee_per_day  DECIMAL(14,2) NOT NULL,
    max_discount_percent DECIMAL(5,2)  NOT NULL,
    updated_by_user_id   BIGINT        NULL,
    updated_at           DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_business_policies PRIMARY KEY (id),
    CONSTRAINT ck_business_policies_single_row CHECK (id = 1),
    CONSTRAINT ck_business_policies_deposit CHECK (deposit_percent BETWEEN 0 AND 100),
    CONSTRAINT ck_business_policies_renewal_notice CHECK (renewal_notice_days >= 0),
    CONSTRAINT ck_business_policies_cancellation CHECK (cancellation_fee >= 0),
    CONSTRAINT ck_business_policies_return_notice CHECK (return_notice_days >= 0),
    CONSTRAINT ck_business_policies_grace CHECK (overdue_grace_days >= 0),
    CONSTRAINT ck_business_policies_overdue_fee CHECK (overdue_fee_per_day >= 0),
    CONSTRAINT ck_business_policies_discount CHECK (max_discount_percent BETWEEN 0 AND 100),
    CONSTRAINT fk_business_policies_updated_by FOREIGN KEY (updated_by_user_id) REFERENCES users (id)
) ENGINE = InnoDB;

CREATE TABLE fee_types (
    id             BIGINT        NOT NULL AUTO_INCREMENT,
    code           VARCHAR(40)   NOT NULL,
    name           VARCHAR(120)  NOT NULL,
    default_amount DECIMAL(14,2) NOT NULL,
    active         BOOLEAN       NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_fee_types PRIMARY KEY (id),
    CONSTRAINT uq_fee_types_code UNIQUE (code),
    CONSTRAINT ck_fee_types_amount CHECK (default_amount >= 0)
) ENGINE = InnoDB;

CREATE TABLE invoices (
    id              BIGINT        NOT NULL AUTO_INCREMENT,
    rental_id       BIGINT        NOT NULL,
    renewal_id      BIGINT        NULL,
    fee_type_id     BIGINT        NULL,
    invoice_type    VARCHAR(12)   NOT NULL,
    description     TEXT          NULL,
    amount          DECIMAL(14,2) NOT NULL,
    discount_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
    total_amount    DECIMAL(14,2) GENERATED ALWAYS AS (amount - discount_amount) STORED,
    due_at          DATETIME(6)   NULL,
    status          VARCHAR(12)   NOT NULL DEFAULT 'PENDING',
    created_at      DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_invoices PRIMARY KEY (id),
    CONSTRAINT ck_invoices_type CHECK (invoice_type IN ('DEPOSIT','RENTAL','RENEWAL','EXTRA','OVERDUE')),
    CONSTRAINT ck_invoices_status CHECK (status IN ('PENDING','PAID','WAIVED','CANCELLED')),
    CONSTRAINT ck_invoices_amount CHECK (amount >= 0),
    CONSTRAINT ck_invoices_discount CHECK (discount_amount >= 0 AND discount_amount <= amount),
    CONSTRAINT ck_invoices_renewal_ref CHECK ((invoice_type = 'RENEWAL') = (renewal_id IS NOT NULL)),
    CONSTRAINT ck_invoices_extra_ref CHECK (invoice_type <> 'EXTRA' OR fee_type_id IS NOT NULL),
    CONSTRAINT fk_invoices_rental FOREIGN KEY (rental_id) REFERENCES rentals (id),
    CONSTRAINT fk_invoices_renewal FOREIGN KEY (renewal_id) REFERENCES rental_renewals (id),
    CONSTRAINT fk_invoices_fee_type FOREIGN KEY (fee_type_id) REFERENCES fee_types (id),
    CONSTRAINT uq_invoices_renewal UNIQUE (renewal_id)
) ENGINE = InnoDB;

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

CREATE INDEX ix_invoices_rental ON invoices (rental_id);
CREATE INDEX ix_invoices_due_status ON invoices (due_at, status);
CREATE INDEX ix_payment_attempts_invoice ON payment_attempts (invoice_id);
