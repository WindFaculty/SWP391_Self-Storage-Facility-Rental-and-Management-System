-- FE1 customer flow needs two more states than the baseline schema allowed:
--   * rentals.RETURN_REQUESTED - customer asked to return the unit, staff has not inspected yet
--   * invoices.EXPIRED          - a hold timed out without payment, the invoice is dead
-- MySQL cannot ALTER a CHECK constraint in place, so each is dropped and re-created.

ALTER TABLE rentals
    DROP CHECK ck_rentals_status,
    ADD CONSTRAINT ck_rentals_status CHECK (status IN ('PENDING_PAYMENT','RESERVED','ACTIVE',
                                                      'OVERDUE','RETURN_REQUESTED','RETURNED',
                                                      'CANCELLED','EXPIRED'));

ALTER TABLE invoices
    DROP CHECK ck_invoices_status,
    ADD CONSTRAINT ck_invoices_status CHECK (status IN ('PENDING','PAID','WAIVED','CANCELLED','EXPIRED'));
