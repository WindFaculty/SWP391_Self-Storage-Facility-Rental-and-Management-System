-- =============================================================================
-- V001 baseline schema: MySQL 8.4 / InnoDB translation of the PostgreSQL
-- reference schema in sql/self_storage_schema.sql (13 tables).
--
-- Conventions (Flyway):
--   * Forward-only: never edit an applied migration; add V{NNN}__*.sql instead.
--   * One logical change per migration; prefix V{NNN}__{snake_case}.
--   * Naming: fk_<table>_<ref>, ck_<table>_<rule>, uq_<table>_<cols>, ix_<table>_<cols>.
--   * Instants are stored in UTC as DATETIME(6) (defaults use UTC_TIMESTAMP(6));
--     money uses DECIMAL, never FLOAT/DOUBLE.
--
-- PostgreSQL -> MySQL translation decisions (plan section 7.3):
--   * TIMESTAMPTZ -> DATETIME(6) UTC, JSONB -> JSON, INET -> VARCHAR(45).
--   * GENERATED ALWAYS AS IDENTITY -> AUTO_INCREMENT.
--   * Partial unique indexes -> plain UNIQUE (MySQL permits many NULLs) or a
--     stored generated column (payments: at most one SUCCESS row per invoice).
--   * The btree_gist EXCLUDE constraint (no overlapping rentals per unit) is
--     NOT expressible in MySQL. Availability/no-overlap must be enforced
--     transactionally with SELECT ... FOR UPDATE on the storage unit for
--     every create-hold, cancel, expiry, renew and re-date (plan section 7.1).
--   * Service-level checks that no constraint can express remain in the
--     service layer; see the footer of sql/self_storage_schema.sql.
-- =============================================================================

-- AREA A: Facility, staff scope, and storage inventory
CREATE TABLE facilities (
    id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code       VARCHAR(30)  NOT NULL,
    name       VARCHAR(150) NOT NULL,
    address    TEXT         NOT NULL,
    status     VARCHAR(12)  NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(6)  NOT NULL DEFAULT (UTC_TIMESTAMP(6)),
    CONSTRAINT uq_facilities_code UNIQUE (code),
    CONSTRAINT ck_facilities_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE users (
    id            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    facility_id   BIGINT       NULL,
    full_name     VARCHAR(120) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    phone         VARCHAR(30)  NULL,
    password_hash TEXT         NOT NULL,
    role          VARCHAR(24)  NOT NULL,
    status        VARCHAR(12)  NOT NULL DEFAULT 'ACTIVE',
    created_at    DATETIME(6)  NOT NULL DEFAULT (UTC_TIMESTAMP(6)),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT ck_users_role CHECK (role IN ('CUSTOMER','FACILITY_STAFF',
                                             'FACILITY_MANAGER','BUSINESS_MANAGER','ADMIN')),
    CONSTRAINT ck_users_status CHECK (status IN ('ACTIVE','DISABLED')),
    CONSTRAINT ck_users_facility_scope CHECK (
        (role IN ('FACILITY_STAFF','FACILITY_MANAGER') AND facility_id IS NOT NULL)
        OR (role IN ('CUSTOMER','BUSINESS_MANAGER','ADMIN') AND facility_id IS NULL)
    ),
    CONSTRAINT fk_users_facility FOREIGN KEY (facility_id)
        REFERENCES facilities (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE unit_types (
    id                BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name              VARCHAR(80)   NOT NULL,
    size_m2           DECIMAL(8,2)  NOT NULL,
    min_monthly_price DECIMAL(14,2) NOT NULL,
    max_monthly_price DECIMAL(14,2) NOT NULL,
    description       TEXT          NULL,
    CONSTRAINT uq_unit_types_name UNIQUE (name),
    CONSTRAINT ck_unit_types_size CHECK (size_m2 > 0),
    CONSTRAINT ck_unit_types_min_price CHECK (min_monthly_price >= 0),
    CONSTRAINT ck_unit_types_price_range CHECK (max_monthly_price >= min_monthly_price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE storage_units (
    id             BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    facility_id    BIGINT        NOT NULL,
    unit_type_id   BIGINT        NOT NULL,
    unit_code      VARCHAR(40)   NOT NULL,
    location_label VARCHAR(100)  NULL,
    monthly_price  DECIMAL(14,2) NOT NULL,
    status         VARCHAR(16)   NOT NULL DEFAULT 'AVAILABLE',
    CONSTRAINT uq_storage_units_facility_code UNIQUE (facility_id, unit_code),
    CONSTRAINT ck_storage_units_price CHECK (monthly_price >= 0),
    CONSTRAINT ck_storage_units_status CHECK (status IN ('AVAILABLE','OCCUPIED','INSPECTION','MAINTENANCE')),
    CONSTRAINT fk_storage_units_facility FOREIGN KEY (facility_id)
        REFERENCES facilities (id) ON DELETE RESTRICT,
    CONSTRAINT fk_storage_units_unit_type FOREIGN KEY (unit_type_id)
        REFERENCES unit_types (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- AREA B: Global rules and configurable extra fees
CREATE TABLE business_policies (
    id                   SMALLINT      NOT NULL DEFAULT 1 PRIMARY KEY,
    deposit_percent      DECIMAL(5,2)  NOT NULL,
    renewal_notice_days  INT           NOT NULL,
    cancellation_fee     DECIMAL(14,2) NOT NULL,
    return_notice_days   INT           NOT NULL,
    overdue_grace_days   INT           NOT NULL,
    overdue_fee_per_day  DECIMAL(14,2) NOT NULL,
    max_discount_percent DECIMAL(5,2)  NOT NULL,
    updated_by_user_id   BIGINT        NULL,
    updated_at           DATETIME(6)   NOT NULL DEFAULT (UTC_TIMESTAMP(6)),
    CONSTRAINT ck_business_policies_singleton CHECK (id = 1),
    CONSTRAINT ck_business_policies_deposit CHECK (deposit_percent BETWEEN 0 AND 100),
    CONSTRAINT ck_business_policies_renewal_notice CHECK (renewal_notice_days >= 0),
    CONSTRAINT ck_business_policies_cancellation_fee CHECK (cancellation_fee >= 0),
    CONSTRAINT ck_business_policies_return_notice CHECK (return_notice_days >= 0),
    CONSTRAINT ck_business_policies_grace CHECK (overdue_grace_days >= 0),
    CONSTRAINT ck_business_policies_overdue_fee CHECK (overdue_fee_per_day >= 0),
    CONSTRAINT ck_business_policies_max_discount CHECK (max_discount_percent BETWEEN 0 AND 100),
    CONSTRAINT fk_business_policies_user FOREIGN KEY (updated_by_user_id)
        REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- No policy row is seeded: only the Business Manager sets deposit %, fees and
-- grace periods (no fictitious business defaults, same rule as the reference).

CREATE TABLE fee_types (
    id             BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code           VARCHAR(40)   NOT NULL,
    name           VARCHAR(120)  NOT NULL,
    default_amount DECIMAL(14,2) NOT NULL,
    active         BOOLEAN       NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_fee_types_code UNIQUE (code),
    CONSTRAINT ck_fee_types_amount CHECK (default_amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- AREA C: Reservation -> check-in -> rental -> renewal -> return
CREATE TABLE rentals (
    id                 BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    customer_id        BIGINT        NOT NULL,
    unit_id            BIGINT        NOT NULL,
    start_date         DATE          NOT NULL,
    end_date           DATE          NOT NULL,
    appointment_at     DATETIME(6)   NULL,
    price_per_month    DECIMAL(14,2) NOT NULL,
    status             VARCHAR(20)   NOT NULL DEFAULT 'PENDING_PAYMENT',
    payment_expires_at DATETIME(6)   NULL,
    checked_in_at      DATETIME(6)   NULL,
    access_method      VARCHAR(20)   NULL,
    handover_condition TEXT          NULL,
    returned_at        DATETIME(6)   NULL,
    return_condition   TEXT          NULL,
    created_at         DATETIME(6)   NOT NULL DEFAULT (UTC_TIMESTAMP(6)),
    CONSTRAINT ck_rentals_dates CHECK (end_date > start_date),
    CONSTRAINT ck_rentals_price CHECK (price_per_month >= 0),
    CONSTRAINT ck_rentals_status CHECK (status IN ('PENDING_PAYMENT','RESERVED','ACTIVE',
                                                   'OVERDUE','RETURNED','CANCELLED','EXPIRED')),
    CONSTRAINT ck_rentals_access_method CHECK (access_method IS NULL
        OR access_method IN ('KEY','ACCESS_CARD','ACCESS_CODE')),
    CONSTRAINT ck_rentals_pending_expiry CHECK (
        status <> 'PENDING_PAYMENT' OR payment_expires_at IS NOT NULL
    ),
    CONSTRAINT ck_rentals_return_order CHECK (
        returned_at IS NULL OR checked_in_at IS NULL OR returned_at >= checked_in_at
    ),
    CONSTRAINT fk_rentals_customer FOREIGN KEY (customer_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_rentals_unit FOREIGN KEY (unit_id)
        REFERENCES storage_units (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- The reference schema used EXCLUDE USING gist to forbid overlapping
-- [start_date, end_date) allocations per unit. MySQL cannot express it:
-- every allocation change must lock the unit row with SELECT ... FOR UPDATE
-- inside one transaction before checking overlap with active statuses
-- ('PENDING_PAYMENT','RESERVED','ACTIVE','OVERDUE').

CREATE TABLE rental_renewals (
    id                  BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    rental_id           BIGINT      NOT NULL,
    previous_end_date   DATE        NOT NULL,
    requested_end_date  DATE        NOT NULL,
    status              VARCHAR(12) NOT NULL DEFAULT 'REQUESTED',
    approved_by_user_id BIGINT      NULL,
    requested_at        DATETIME(6) NOT NULL DEFAULT (UTC_TIMESTAMP(6)),
    decided_at          DATETIME(6) NULL,
    CONSTRAINT ck_rental_renewals_extends CHECK (requested_end_date > previous_end_date),
    CONSTRAINT ck_rental_renewals_status CHECK (status IN ('REQUESTED','APPROVED','REJECTED','APPLIED')),
    CONSTRAINT fk_rental_renewals_rental FOREIGN KEY (rental_id)
        REFERENCES rentals (id) ON DELETE RESTRICT,
    CONSTRAINT fk_rental_renewals_user FOREIGN KEY (approved_by_user_id)
        REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- AREA D: Fee billing, waived amounts, and payment transactions
CREATE TABLE invoices (
    id              BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
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
    created_at      DATETIME(6)   NOT NULL DEFAULT (UTC_TIMESTAMP(6)),
    -- MySQL UNIQUE allows many NULLs, so this equals the PostgreSQL
    -- partial unique index ux_invoices_renewal.
    CONSTRAINT uq_invoices_renewal UNIQUE (renewal_id),
    CONSTRAINT ck_invoices_type CHECK (invoice_type IN ('DEPOSIT','RENTAL','RENEWAL','EXTRA','OVERDUE')),
    CONSTRAINT ck_invoices_status CHECK (status IN ('PENDING','PAID','WAIVED','CANCELLED')),
    CONSTRAINT ck_invoices_amount CHECK (amount >= 0),
    CONSTRAINT ck_invoices_discount CHECK (discount_amount >= 0 AND discount_amount <= amount),
    CONSTRAINT ck_invoices_renewal_ref CHECK (
        (invoice_type = 'RENEWAL' AND renewal_id IS NOT NULL)
        OR (invoice_type <> 'RENEWAL' AND renewal_id IS NULL)
    ),
    CONSTRAINT ck_invoices_extra_ref CHECK (invoice_type <> 'EXTRA' OR fee_type_id IS NOT NULL),
    CONSTRAINT fk_invoices_rental FOREIGN KEY (rental_id)
        REFERENCES rentals (id) ON DELETE RESTRICT,
    CONSTRAINT fk_invoices_renewal FOREIGN KEY (renewal_id)
        REFERENCES rental_renewals (id) ON DELETE RESTRICT,
    CONSTRAINT fk_invoices_fee_type FOREIGN KEY (fee_type_id)
        REFERENCES fee_types (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE payments (
    id                 BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    invoice_id         BIGINT        NOT NULL,
    amount             DECIMAL(14,2) NOT NULL,
    method             VARCHAR(30)   NOT NULL,
    provider_reference VARCHAR(120)  NULL,
    status             VARCHAR(12)   NOT NULL DEFAULT 'PENDING',
    -- Mirrors the PostgreSQL partial unique index ux_payments_one_success:
    -- at most one SUCCESS payment per invoice, enforced by the unique index
    -- on this generated column.
    success_invoice_id BIGINT GENERATED ALWAYS AS (IF(status = 'SUCCESS', invoice_id, NULL)) STORED,
    paid_at            DATETIME(6)   NULL,
    created_at         DATETIME(6)   NOT NULL DEFAULT (UTC_TIMESTAMP(6)),
    CONSTRAINT uq_payments_provider_reference UNIQUE (provider_reference),
    CONSTRAINT uq_payments_one_success UNIQUE (success_invoice_id),
    CONSTRAINT ck_payments_amount CHECK (amount > 0),
    CONSTRAINT ck_payments_status CHECK (status IN ('PENDING','SUCCESS','FAILED','REFUNDED')),
    CONSTRAINT fk_payments_invoice FOREIGN KEY (invoice_id)
        REFERENCES invoices (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- AREA E: Customer support, employee assignments, audit + login events
CREATE TABLE support_tickets (
    id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT       NOT NULL,
    facility_id BIGINT       NOT NULL,
    rental_id   BIGINT       NULL,
    category    VARCHAR(20)  NOT NULL,
    title       VARCHAR(200) NOT NULL,
    description TEXT         NOT NULL,
    status      VARCHAR(16)  NOT NULL DEFAULT 'OPEN',
    created_at  DATETIME(6)  NOT NULL DEFAULT (UTC_TIMESTAMP(6)),
    resolved_at DATETIME(6)  NULL,
    CONSTRAINT ck_support_tickets_category CHECK (category IN ('UNIT','LOCK','ACCESS','PAYMENT','ITEMS','OTHER')),
    CONSTRAINT ck_support_tickets_status CHECK (status IN ('OPEN','IN_PROGRESS','RESOLVED','CLOSED')),
    CONSTRAINT fk_support_tickets_customer FOREIGN KEY (customer_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_support_tickets_facility FOREIGN KEY (facility_id)
        REFERENCES facilities (id) ON DELETE RESTRICT,
    CONSTRAINT fk_support_tickets_rental FOREIGN KEY (rental_id)
        REFERENCES rentals (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE staff_tasks (
    id                BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    assigned_staff_id BIGINT      NOT NULL,
    rental_id         BIGINT      NULL,
    ticket_id         BIGINT      NULL,
    task_type         VARCHAR(20) NOT NULL,
    scheduled_at      DATETIME(6) NOT NULL,
    status            VARCHAR(12) NOT NULL DEFAULT 'ASSIGNED',
    completed_at      DATETIME(6) NULL,
    notes             TEXT        NULL,
    CONSTRAINT ck_staff_tasks_type CHECK (task_type IN ('HANDOVER','RETURN_INSPECTION',
                                                        'UNIT_INSPECTION','SUPPORT')),
    CONSTRAINT ck_staff_tasks_status CHECK (status IN ('ASSIGNED','IN_PROGRESS','DONE','CANCELLED')),
    CONSTRAINT ck_staff_tasks_target CHECK (
        (task_type = 'SUPPORT' AND ticket_id IS NOT NULL AND rental_id IS NULL)
        OR (task_type IN ('HANDOVER','RETURN_INSPECTION','UNIT_INSPECTION')
            AND rental_id IS NOT NULL AND ticket_id IS NULL)
    ),
    CONSTRAINT fk_staff_tasks_staff FOREIGN KEY (assigned_staff_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_staff_tasks_rental FOREIGN KEY (rental_id)
        REFERENCES rentals (id) ON DELETE RESTRICT,
    CONSTRAINT fk_staff_tasks_ticket FOREIGN KEY (ticket_id)
        REFERENCES support_tickets (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE activity_logs (
    id          BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT      NULL,
    action      VARCHAR(80) NOT NULL,
    entity_type VARCHAR(60) NULL,
    entity_id   BIGINT      NULL,
    ip_address  VARCHAR(45) NULL, -- was INET in PostgreSQL
    metadata    JSON        NULL,
    created_at  DATETIME(6) NOT NULL DEFAULT (UTC_TIMESTAMP(6)),
    CONSTRAINT fk_activity_logs_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Supporting query indexes for daily staff work, customer accounts, and dashboards.
CREATE INDEX ix_users_facility ON users (facility_id);
CREATE INDEX ix_storage_units_facility_type ON storage_units (facility_id, unit_type_id, status);
CREATE INDEX ix_rentals_customer_status ON rentals (customer_id, status);
CREATE INDEX ix_rentals_status_end ON rentals (status, end_date);
CREATE INDEX ix_rentals_unit ON rentals (unit_id);
CREATE INDEX ix_rental_renewals_rental ON rental_renewals (rental_id);
CREATE INDEX ix_invoices_rental ON invoices (rental_id);
CREATE INDEX ix_invoices_due_status ON invoices (due_at, status);
CREATE INDEX ix_payments_invoice ON payments (invoice_id);
CREATE INDEX ix_support_tickets_facility_status ON support_tickets (facility_id, status);
CREATE INDEX ix_support_tickets_customer ON support_tickets (customer_id);
CREATE INDEX ix_staff_tasks_staff_schedule ON staff_tasks (assigned_staff_id, scheduled_at);
CREATE INDEX ix_staff_tasks_rental ON staff_tasks (rental_id);
CREATE INDEX ix_staff_tasks_ticket ON staff_tasks (ticket_id);
CREATE INDEX ix_activity_logs_user_time ON activity_logs (user_id, created_at DESC);
