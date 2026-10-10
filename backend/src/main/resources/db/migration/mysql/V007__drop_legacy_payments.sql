-- The reference PostgreSQL schema ships a single `payments` table; the BE3 payment
-- model replaced it with `payment_attempts` (V003) plus audit columns (V004, V005).
-- The legacy table is unreferenced by entities, services, tests and seeds - drop it.
DROP TABLE payments;
