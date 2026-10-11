package com.storage.account;

import com.jayway.jsonpath.JsonPath;
import com.storage.account.entity.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;

import java.util.UUID;

import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
class AdminAndAuditTests {

    @Container
    @ServiceConnection
    static final MySQLContainer MYSQL = new MySQLContainer("mysql:8.4");

    private static final String PASSWORD = "secret-pass-123";

    @Autowired
    MockMvc mvc;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    PasswordEncoder passwordEncoder;

    String suffix;
    String adminEmail;
    String adminToken;
    String businessToken;
    Long facilityAId;
    Long facilityBId;

    @BeforeEach
    void setUp() throws Exception {
        suffix = UUID.randomUUID().toString().substring(0, 6);
        facilityAId = insertFacility("A-" + suffix);
        facilityBId = insertFacility("B-" + suffix);

        adminEmail = "admin-" + suffix + "@example.com";
        adminToken = createUserAndLogin(adminEmail, UserRole.ADMIN, null);
        businessToken = createUserAndLogin("business-" + suffix + "@example.com",
                UserRole.BUSINESS_MANAGER, null);
    }

    @Test
    void adminCreatesInternalAccountsWithFacilityRules() throws Exception {
        MvcResult created = mvc.perform(post("/admin/users")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createUserBody("manager-" + suffix, UserRole.FACILITY_MANAGER, facilityAId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.role").value("FACILITY_MANAGER"))
                .andExpect(jsonPath("$.data.facilityId").value(facilityAId))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andReturn();
        readLong(created, "$.data.id");

        loginExpectOk("manager-" + suffix + "@example.com");

        mvc.perform(post("/admin/users")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createUserBody("staff-" + suffix, UserRole.FACILITY_STAFF, null)))
                .andExpect(status().isBadRequest());

        mvc.perform(post("/admin/users")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createUserBody("admin2-" + suffix, UserRole.ADMIN, facilityAId)))
                .andExpect(status().isBadRequest());

        mvc.perform(post("/admin/users")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createUserBody("manager-" + suffix, UserRole.FACILITY_MANAGER, facilityBId)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("EMAIL_ALREADY_EXISTS"));

        mvc.perform(post("/admin/users")
                        .header("Authorization", bearer(businessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createUserBody("manager2-" + suffix, UserRole.FACILITY_MANAGER, facilityAId)))
                .andExpect(status().isForbidden());

        mvc.perform(get("/admin/users")
                        .header("Authorization", bearer(adminToken))
                        .param("facilityId", facilityAId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[*].email",
                        hasItem("manager-" + suffix + "@example.com")));
    }

    @Test
    void disablingUserBlocksExistingTokensAndRelogin() throws Exception {
        MvcResult created = mvc.perform(post("/admin/users")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createUserBody("staff2-" + suffix, UserRole.FACILITY_STAFF, facilityAId)))
                .andExpect(status().isCreated())
                .andReturn();
        Long userId = readLong(created, "$.data.id");
        String staffEmail = "staff2-" + suffix + "@example.com";

        String staffToken = loginExpectOk(staffEmail);
        mvc.perform(get("/auth/me").header("Authorization", bearer(staffToken)))
                .andExpect(status().isOk());

        mvc.perform(put("/admin/users/" + userId + "/status")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DISABLED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("DISABLED"));

        mvc.perform(get("/auth/me").header("Authorization", bearer(staffToken)))
                .andExpect(status().isUnauthorized());

        mvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"%s"}
                                """.formatted(staffEmail, PASSWORD)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("USER_INACTIVE"));

        Long adminId = readLong(mvc.perform(get("/auth/me")
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk())
                .andReturn(), "$.data.id");

        mvc.perform(put("/admin/users/" + adminId + "/status")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DISABLED\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void auditLogsCaptureAuthAndAdminEvents() throws Exception {
        mvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"wrong-password-1"}
                                """.formatted(adminEmail)))
                .andExpect(status().isUnauthorized());

        mvc.perform(post("/admin/users")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createUserBody("manager3-" + suffix, UserRole.FACILITY_MANAGER, facilityAId)))
                .andExpect(status().isCreated());

        mvc.perform(get("/admin/audit-logs")
                        .header("Authorization", bearer(adminToken))
                        .param("action", "LOGIN_FAILED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[*].metadata.email", hasItem(adminEmail)));

        Long adminId = readLong(mvc.perform(get("/auth/me")
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk())
                .andReturn(), "$.data.id");

        mvc.perform(get("/admin/audit-logs")
                        .header("Authorization", bearer(adminToken))
                        .param("userId", adminId.toString())
                        .param("action", "LOGIN_SUCCESS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1));

        mvc.perform(get("/admin/audit-logs")
                        .header("Authorization", bearer(adminToken))
                        .param("action", "USER_CREATED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].action").value("USER_CREATED"))
                .andExpect(jsonPath("$.data.content[0].entityType").value("USER"))
                .andExpect(jsonPath("$.data.content[0].ipAddress").isNotEmpty());

        mvc.perform(get("/admin/audit-logs").header("Authorization", bearer(businessToken)))
                .andExpect(status().isForbidden());

        mvc.perform(get("/admin/audit-logs"))
                .andExpect(status().isUnauthorized());
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private String createUserBody(String emailPrefix, UserRole role, Long facilityId) {
        String facility = facilityId == null ? "null" : facilityId.toString();
        return """
                {"email":"%s@example.com","password":"%s","fullName":"Test %s","role":"%s","facilityId":%s}
                """.formatted(emailPrefix, PASSWORD, role, role.name(), facility);
    }

    private Long readLong(MvcResult result, String path) throws Exception {
        Number value = JsonPath.read(result.getResponse().getContentAsString(), path);
        return value.longValue();
    }

    private String loginExpectOk(String email) throws Exception {
        MvcResult result = mvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"%s"}
                                """.formatted(email, PASSWORD)))
                .andExpect(status().isOk())
                .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.data.accessToken");
    }

    private Long insertFacility(String codeSuffix) {
        String code = "FAC-" + codeSuffix;
        jdbc.update("INSERT INTO facilities (code, name, address, status) VALUES (?, ?, ?, 'ACTIVE')",
                code, "Facility " + code, "Test Address " + code);
        return jdbc.queryForObject("SELECT id FROM facilities WHERE code = ?", Long.class, code);
    }

    private String createUserAndLogin(String email, UserRole role, Long facilityId) throws Exception {
        jdbc.update("""
                INSERT INTO users (facility_id, full_name, email, password_hash, role, status)
                VALUES (?, ?, ?, ?, ?, 'ACTIVE')
                """, facilityId, "Test " + role, email, passwordEncoder.encode(PASSWORD), role.name());
        return loginExpectOk(email);
    }
}
