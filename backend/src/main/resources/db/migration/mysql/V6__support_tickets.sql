-- BE3-06: support tickets with single assignee. The support_tickets table, its indexes and
-- the staff_tasks model (SUPPORT/HANDOVER/RETURN_INSPECTION/UNIT_INSPECTION) already ship
-- in V001__baseline_schema.sql (merged BE1/BE2 schema); this adds the assignee column.
ALTER TABLE support_tickets
    ADD COLUMN assigned_staff_id BIGINT NULL,
    ADD CONSTRAINT fk_support_tickets_assigned_staff FOREIGN KEY (assigned_staff_id) REFERENCES users (id);
