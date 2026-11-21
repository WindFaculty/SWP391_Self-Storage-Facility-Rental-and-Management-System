package com.storage;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("local")
@Testcontainers
class LocalSeedTests {

    @Container
    @ServiceConnection
    static final MySQLContainer MYSQL = new MySQLContainer("mysql:8.4");

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void demoCatalogSeedIsAppliedOnlyInLocalProfile() {
        Integer facilities = jdbc.queryForObject(
                "SELECT COUNT(*) FROM facilities WHERE code = 'DEMO-HCM-01'", Integer.class);
        Integer units = jdbc.queryForObject(
                "SELECT COUNT(*) FROM storage_units", Integer.class);
        assertThat(facilities).isEqualTo(1);
        // The local expansion adds three units at each of the other three facilities.
        assertThat(units).isEqualTo(25);
        assertThat(jdbc.queryForObject(
                "SELECT COUNT(*) FROM warehouse_images WHERE facility_id IS NOT NULL", Integer.class)).isEqualTo(4);
        assertThat(jdbc.queryForObject(
                "SELECT COUNT(DISTINCT storage_unit_id) FROM warehouse_images", Integer.class)).isEqualTo(25);

        Long facilityId = jdbc.queryForObject("SELECT id FROM facilities WHERE code='DEMO-HCM-01'", Long.class);
        jdbc.update("DELETE FROM warehouse_images WHERE facility_id=?", facilityId);
        jdbc.update("UPDATE facilities SET image_url=NULL WHERE id=?", facilityId);
        new org.springframework.jdbc.datasource.init.ResourceDatabasePopulator(
                new org.springframework.core.io.ClassPathResource("db/seed/local/R__demo_catalog_seed.sql"))
                .execute(java.util.Objects.requireNonNull(jdbc.getDataSource()));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM warehouse_images WHERE facility_id=?", Integer.class, facilityId)).isZero();
        assertThat(jdbc.queryForObject("SELECT image_url FROM facilities WHERE id=?", String.class, facilityId)).isNull();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM storage_units", Integer.class)).isEqualTo(25);
    }
}
