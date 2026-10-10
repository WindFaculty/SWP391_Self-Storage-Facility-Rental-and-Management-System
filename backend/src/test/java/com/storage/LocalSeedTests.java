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
        assertThat(units).isEqualTo(3);
    }
}
