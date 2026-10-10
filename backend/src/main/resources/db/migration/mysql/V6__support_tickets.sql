-- BE3-06: support tickets with single assignee. The full staff_tasks model (SUPPORT/HANDOVER/
-- RETURN_INSPECTION/UNIT_INSPECTION) belongs to BE2's task model; this table covers the ticket
-- workflow until that lands.
CREATE TABLE support_tickets (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    customer_id       BIGINT       NOT NULL,
    facility_id       BIGINT       NOT NULL,
    rental_id         BIGINT       NULL,
    assigned_staff_id BIGINT       NULL,
    category          VARCHAR(20)  NOT NULL,
    title             VARCHAR(200) NOT NULL,
    description       TEXT         NOT NULL,
    status            VARCHAR(16)  NOT NULL DEFAULT 'OPEN',
    created_at        DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    resolved_at       DATETIME(6)  NULL,
    CONSTRAINT pk_support_tickets PRIMARY KEY (id),
    CONSTRAINT ck_support_tickets_category CHECK (category IN ('UNIT','LOCK','ACCESS','PAYMENT','ITEMS','OTHER')),
    CONSTRAINT ck_support_tickets_status CHECK (status IN ('OPEN','IN_PROGRESS','RESOLVED','CLOSED')),
    CONSTRAINT fk_support_tickets_customer FOREIGN KEY (customer_id) REFERENCES users (id),
    CONSTRAINT fk_support_tickets_facility FOREIGN KEY (facility_id) REFERENCES facilities (id),
    CONSTRAINT fk_support_tickets_rental FOREIGN KEY (rental_id) REFERENCES rentals (id),
    CONSTRAINT fk_support_tickets_assigned_staff FOREIGN KEY (assigned_staff_id) REFERENCES users (id),
    INDEX ix_support_tickets_facility_status (facility_id, status),
    INDEX ix_support_tickets_customer (customer_id)
) ENGINE = InnoDB;
