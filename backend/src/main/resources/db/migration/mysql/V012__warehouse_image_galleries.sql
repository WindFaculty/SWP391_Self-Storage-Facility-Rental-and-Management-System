CREATE TABLE warehouse_images (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    facility_id BIGINT NULL,
    storage_unit_id BIGINT NULL,
    storage_key VARCHAR(80) NULL,
    legacy_url VARCHAR(500) NULL,
    content_type VARCHAR(30) NULL,
    size_bytes BIGINT NULL,
    sort_order INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_image_facility FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE,
    CONSTRAINT fk_image_unit FOREIGN KEY (storage_unit_id) REFERENCES storage_units(id) ON DELETE CASCADE,
    CONSTRAINT ck_image_owner CHECK ((facility_id IS NULL) <> (storage_unit_id IS NULL)),
    CONSTRAINT ck_image_source CHECK ((storage_key IS NULL) <> (legacy_url IS NULL)),
    CONSTRAINT ck_image_order CHECK (sort_order >= 0),
    UNIQUE KEY uq_image_storage (storage_key),
    UNIQUE KEY uq_facility_image_order (facility_id, sort_order),
    UNIQUE KEY uq_unit_image_order (storage_unit_id, sort_order)
);

INSERT INTO warehouse_images (id, facility_id, legacy_url, sort_order)
SELECT UUID(), id, image_url, 0 FROM facilities
WHERE image_url IS NOT NULL AND TRIM(image_url) <> '';
