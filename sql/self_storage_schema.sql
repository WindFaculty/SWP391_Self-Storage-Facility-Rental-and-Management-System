-- SWP391 - Self-Storage Facility Rental and Management System
-- Minimal PostgreSQL relational schema (13 tables)
-- Convention: snake_case, plural table names, PK = id, FK = <entity>_id.
-- Reservation and contract share one lifecycle in rentals.
-- Time interval [start_date, end_date): end_date is EXCLUSIVE.

BEGIN;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- AREA A: Facility, staff scope, and storage inventory
CREATE TABLE facilities (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code         VARCHAR(30) NOT NULL UNIQUE,
    name         VARCHAR(150) NOT NULL,
    address      TEXT NOT NULL,
    status       VARCHAR(12) NOT NULL DEFAULT 'ACTIVE'
                 CHECK (status IN ('ACTIVE','INACTIVE')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    facility_id     BIGINT REFERENCES facilities(id) ON DELETE RESTRICT,
    full_name       VARCHAR(120) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    phone           VARCHAR(30),
    password_hash   TEXT NOT NULL,
    role            VARCHAR(24) NOT NULL
                    CHECK (role IN ('CUSTOMER','FACILITY_STAFF',
                                   'FACILITY_MANAGER','BUSINESS_MANAGER','ADMIN')),
    status          VARCHAR(12) NOT NULL DEFAULT 'ACTIVE'
                    CHECK (status IN ('ACTIVE','DISABLED')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_users_facility_scope CHECK (
       (role IN ('FACILITY_STAFF','FACILITY_MANAGER') AND facility_id IS NOT NULL)
       OR (role IN ('CUSTOMER','BUSINESS_MANAGER','ADMIN') AND facility_id IS NULL)
    )
);

CREATE TABLE unit_types (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name                VARCHAR(80) NOT NULL UNIQUE,
    size_m2             NUMERIC(8,2) NOT NULL CHECK (size_m2 > 0),
    min_monthly_price   NUMERIC(14,2) NOT NULL CHECK (min_monthly_price >= 0),
    max_monthly_price   NUMERIC(14,2) NOT NULL CHECK (max_monthly_price >= min_monthly_price),
    description         TEXT
);

CREATE TABLE storage_units (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    facility_id    BIGINT NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
    unit_type_id   BIGINT NOT NULL REFERENCES unit_types(id) ON DELETE RESTRICT,
    unit_code      VARCHAR(40) NOT NULL,
    location_label VARCHAR(100),
    monthly_price  NUMERIC(14,2) NOT NULL CHECK (monthly_price >= 0),
    status         VARCHAR(16) NOT NULL DEFAULT 'AVAILABLE'
                   CHECK (status IN ('AVAILABLE','OCCUPIED','INSPECTION','MAINTENANCE')),
    CONSTRAINT uq_storage_units_facility_code UNIQUE (facility_id, unit_code)
);

-- AREA B: Global rules and configurable extra fees
CREATE TABLE business_policies (
    id                    SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    deposit_percent       NUMERIC(5,2) NOT NULL CHECK (deposit_percent BETWEEN 0 AND 100),
    renewal_notice_days   INTEGER NOT NULL CHECK (renewal_notice_days >= 0),
    cancellation_fee      NUMERIC(14,2) NOT NULL CHECK (cancellation_fee >= 0),
    return_notice_days    INTEGER NOT NULL CHECK (return_notice_days >= 0),
    overdue_grace_days    INTEGER NOT NULL CHECK (overdue_grace_days >= 0),
    overdue_fee_per_day   NUMERIC(14,2) NOT NULL CHECK (overdue_fee_per_day >= 0),
    max_discount_percent  NUMERIC(5,2) NOT NULL CHECK (max_discount_percent BETWEEN 0 AND 100),
    updated_by_user_id    BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fee_types (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code            VARCHAR(40) NOT NULL UNIQUE,
    name            VARCHAR(120) NOT NULL,
    default_amount  NUMERIC(14,2) NOT NULL CHECK (default_amount >= 0),
    active          BOOLEAN NOT NULL DEFAULT TRUE
);

-- AREA C: Reservation -> check-in -> rental -> renewal -> return
CREATE TABLE rentals (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    unit_id            BIGINT NOT NULL REFERENCES storage_units(id) ON DELETE RESTRICT,
    start_date         DATE NOT NULL,
    end_date           DATE NOT NULL,
    appointment_at     TIMESTAMPTZ,
    price_per_month    NUMERIC(14,2) NOT NULL CHECK (price_per_month >= 0),
    status             VARCHAR(20) NOT NULL DEFAULT 'PENDING_PAYMENT'
                       CHECK (status IN ('PENDING_PAYMENT','RESERVED','ACTIVE',
                                        'OVERDUE','RETURNED','CANCELLED','EXPIRED')),
    payment_expires_at TIMESTAMPTZ,
    checked_in_at      TIMESTAMPTZ,
    access_method      VARCHAR(20) CHECK (access_method IN ('KEY','ACCESS_CARD','ACCESS_CODE')),
    handover_condition TEXT,
    returned_at        TIMESTAMPTZ,
    return_condition   TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_rentals_dates CHECK (end_date > start_date),
    CONSTRAINT ck_rentals_pending_expiry CHECK (
        status <> 'PENDING_PAYMENT' OR payment_expires_at IS NOT NULL
    ),
    CONSTRAINT ck_rentals_return_order CHECK (
        returned_at IS NULL OR checked_in_at IS NULL OR returned_at >= checked_in_at
    )
);

-- Core double-booking safeguard. Holds and live bookings cannot overlap.
-- Application must expire abandoned PENDING_PAYMENT holds before reuse.
-- For extensions: lock the rental, check availability, then update end_date.
ALTER TABLE rentals ADD CONSTRAINT ex_rentals_no_overlap
    EXCLUDE USING gist (
        unit_id WITH =,
        daterange(start_date, end_date, '[)') WITH &&
    )
    WHERE (status IN ('PENDING_PAYMENT','RESERVED','ACTIVE','OVERDUE'));

CREATE TABLE rental_renewals (
    id                     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    rental_id              BIGINT NOT NULL REFERENCES rentals(id) ON DELETE RESTRICT,
    previous_end_date      DATE NOT NULL,
    requested_end_date     DATE NOT NULL,
    status                 VARCHAR(12) NOT NULL DEFAULT 'REQUESTED'
                           CHECK (status IN ('REQUESTED','APPROVED','REJECTED','APPLIED')),
    approved_by_user_id    BIGINT REFERENCES users(id) ON DELETE SET NULL,
    requested_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    decided_at             TIMESTAMPTZ,
    CONSTRAINT ck_renewal_extends CHECK (requested_end_date > previous_end_date)
);

-- AREA D: Fee billing, waived amounts, and payment transactions
CREATE TABLE invoices (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    rental_id         BIGINT NOT NULL REFERENCES rentals(id) ON DELETE RESTRICT,
    renewal_id        BIGINT REFERENCES rental_renewals(id) ON DELETE RESTRICT,
    fee_type_id       BIGINT REFERENCES fee_types(id) ON DELETE RESTRICT,
    invoice_type      VARCHAR(12) NOT NULL
                      CHECK (invoice_type IN ('DEPOSIT','RENTAL','RENEWAL','EXTRA','OVERDUE')),
    description       TEXT,
    amount            NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    discount_amount   NUMERIC(14,2) NOT NULL DEFAULT 0
                      CHECK (discount_amount >= 0 AND discount_amount <= amount),
    total_amount      NUMERIC(14,2) GENERATED ALWAYS AS (amount - discount_amount) STORED,
    due_at            TIMESTAMPTZ,
    status            VARCHAR(12) NOT NULL DEFAULT 'PENDING'
                      CHECK (status IN ('PENDING','PAID','WAIVED','CANCELLED')),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_invoices_renewal_ref CHECK (
        (invoice_type = 'RENEWAL' AND renewal_id IS NOT NULL)
        OR (invoice_type <> 'RENEWAL' AND renewal_id IS NULL)
    ),
    CONSTRAINT ck_invoices_extra_ref CHECK (
        invoice_type <> 'EXTRA' OR fee_type_id IS NOT NULL
    )
);
CREATE UNIQUE INDEX ux_invoices_renewal ON invoices(renewal_id) WHERE renewal_id IS NOT NULL;

CREATE TABLE payments (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    invoice_id          BIGINT NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
    amount              NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    method              VARCHAR(30) NOT NULL,
    provider_reference  VARCHAR(120) UNIQUE,
    status              VARCHAR(12) NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING','SUCCESS','FAILED','REFUNDED')),
    paid_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Minimal business rule: only one successful full payment per invoice.
CREATE UNIQUE INDEX ux_payments_one_success ON payments(invoice_id) WHERE status = 'SUCCESS';

-- AREA E: Customer support, employee assignments, audit + login events
CREATE TABLE support_tickets (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    facility_id   BIGINT NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
    rental_id     BIGINT REFERENCES rentals(id) ON DELETE RESTRICT,
    category      VARCHAR(20) NOT NULL
                  CHECK (category IN ('UNIT','LOCK','ACCESS','PAYMENT','ITEMS','OTHER')),
    title         VARCHAR(200) NOT NULL,
    description   TEXT NOT NULL,
    status        VARCHAR(16) NOT NULL DEFAULT 'OPEN'
                  CHECK (status IN ('OPEN','IN_PROGRESS','RESOLVED','CLOSED')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at   TIMESTAMPTZ
);

CREATE TABLE staff_tasks (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    assigned_staff_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    rental_id         BIGINT REFERENCES rentals(id) ON DELETE RESTRICT,
    ticket_id         BIGINT REFERENCES support_tickets(id) ON DELETE RESTRICT,
    task_type         VARCHAR(20) NOT NULL
                      CHECK (task_type IN ('HANDOVER','RETURN_INSPECTION',
                                          'UNIT_INSPECTION','SUPPORT')),
    scheduled_at      TIMESTAMPTZ NOT NULL,
    status            VARCHAR(12) NOT NULL DEFAULT 'ASSIGNED'
                      CHECK (status IN ('ASSIGNED','IN_PROGRESS','DONE','CANCELLED')),
    completed_at      TIMESTAMPTZ,
    notes             TEXT,
    CONSTRAINT ck_tasks_target CHECK (
        (task_type = 'SUPPORT' AND ticket_id IS NOT NULL AND rental_id IS NULL)
        OR (task_type IN ('HANDOVER','RETURN_INSPECTION','UNIT_INSPECTION')
            AND rental_id IS NOT NULL AND ticket_id IS NULL)
    )
);

CREATE TABLE activity_logs (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id        BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action         VARCHAR(80) NOT NULL,  -- LOGIN_SUCCESS, LOGIN_FAILED, UPDATE_UNIT, ...
    entity_type    VARCHAR(60),
    entity_id      BIGINT,
    ip_address     INET,
    metadata       JSONB,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Supporting query indexes for daily staff work, customer accounts, and dashboards.
CREATE INDEX ix_users_facility ON users(facility_id);
CREATE INDEX ix_units_facility_type ON storage_units(facility_id, unit_type_id, status);
CREATE INDEX ix_rentals_customer_status ON rentals(customer_id, status);
CREATE INDEX ix_rentals_status_end ON rentals(status, end_date);
CREATE INDEX ix_rentals_unit ON rentals(unit_id);
CREATE INDEX ix_renewals_rental ON rental_renewals(rental_id);
CREATE INDEX ix_invoices_rental ON invoices(rental_id);
CREATE INDEX ix_invoices_due_status ON invoices(due_at, status);
CREATE INDEX ix_payments_invoice ON payments(invoice_id);
CREATE INDEX ix_tickets_facility_status ON support_tickets(facility_id, status);
CREATE INDEX ix_tickets_customer ON support_tickets(customer_id);
CREATE INDEX ix_tasks_staff_schedule ON staff_tasks(assigned_staff_id, scheduled_at);
CREATE INDEX ix_tasks_rental ON staff_tasks(rental_id);
CREATE INDEX ix_tasks_ticket ON staff_tasks(ticket_id);
CREATE INDEX ix_activity_user_time ON activity_logs(user_id, created_at DESC);

-- The Business Operations Manager must set the first policy row before sales begin.
-- Rates and grace periods were NOT supplied in the requirements, so no
-- fictitious defaults are inserted here.
COMMIT;

-- REQUIRED SERVICE-LEVEL CHECKS (not reducible to ordinary CHECK/FK constraints):
-- 1. users.role='CUSTOMER' for rentals.customer_id and support_tickets.customer_id.
-- 2. staff_tasks.assigned_staff_id belongs to a FACILITY_STAFF at the target facility.
-- 3. rental.unit and optional ticket.rental belong to the proper facility; reject cross-scope access.
-- 4. storage_units.monthly_price stays within its unit_types price range.
-- 5. For selected dates: reject overlapping active allocations, check physical
--    state (MAINTENANCE/INSPECTION blocks bookings) and lock rows transactionally.
--    An OCCUPIED unit may be prebooked after the current rental ends.
-- 6. Only confirmed, fully paid invoices advance relevant rental/renewal status.
-- 7. Expire unpaid holds using payment_expires_at and status='EXPIRED'.
-- 8. On overdue, physically unreturned units remain OCCUPIED; reassign conflicting
--    upcoming reservations as a separate operational exception.
-- 9. Validate payment amount equals invoice.total_amount, and policy discount ceilings;
--    accept gateway callbacks idempotently by provider_reference.
-- 10. Update unit status to INSPECTION on return and AVAILABLE after passing inspection.
