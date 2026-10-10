package com.storage.shared;

import com.jayway.jsonpath.JsonPath;
import com.storage.account.entity.UserRole;
import com.storage.account.entity.UserStatus;
import com.storage.facility.service.FacilityAccessService;
import com.storage.shared.exception.ForbiddenException;
import com.storage.shared.security.OwnershipService;
import com.storage.shared.security.UserPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
class RbacAndScopeTests {

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

    @Autowired
    FacilityAccessService facilityAccess;

    @Autowired
    OwnershipService ownership;

    Long facilityAId;
    Long facilityBId;
    String customerToken;
    String staffAToken;
    String managerAToken;
    String businessToken;
    String adminToken;

    @BeforeEach
    void setUp() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        facilityAId = insertFacility("A-" + suffix);
        facilityBId = insertFacility("B-" + suffix);

        customerToken = createUserAndLogin("customer-" + suffix, UserRole.CUSTOMER, null);
        staffAToken = createUserAndLogin("staff-" + suffix, UserRole.FACILITY_STAFF, facilityAId);
        managerAToken = createUserAndLogin("manager-" + suffix, UserRole.FACILITY_MANAGER, facilityAId);
        businessToken = createUserAndLogin("business-" + suffix, UserRole.BUSINESS_MANAGER, null);
        adminToken = createUserAndLogin("admin-" + suffix, UserRole.ADMIN, null);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void routePrefixesFollowTheRoleMatrix() throws Exception {
        mvc.perform(get("/customer/ping"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));

        mvc.perform(get("/customer/ping").header("Authorization", bearer(customerToken)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/staff/ping").header("Authorization", bearer(customerToken)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));

        mvc.perform(get("/staff/ping").header("Authorization", bearer(staffAToken)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/admin/ping").header("Authorization", bearer(staffAToken)))
                .andExpect(status().isForbidden());

        mvc.perform(get("/manager/ping").header("Authorization", bearer(managerAToken)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/staff/ping").header("Authorization", bearer(managerAToken)))
                .andExpect(status().isNotFound());

        mvc.perform(get("/business/ping").header("Authorization", bearer(businessToken)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/admin/ping").header("Authorization", bearer(businessToken)))
                .andExpect(status().isForbidden());

        mvc.perform(get("/admin/ping").header("Authorization", bearer(adminToken)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/customer/ping").header("Authorization", bearer(adminToken)))
                .andExpect(status().isNotFound());
    }

    @Test
    void facilityScopeRestrictsStaffAndManagerToTheirAssignedFacility() {
        authenticateAs(1L, UserRole.FACILITY_STAFF, facilityAId);
        assertThat(facilityAccess.canAccessFacility(facilityAId)).isTrue();
        assertThat(facilityAccess.canAccessFacility(facilityBId)).isFalse();
        assertThatThrownBy(() -> facilityAccess.requireFacilityAccess(facilityBId))
                .isInstanceOf(ForbiddenException.class);

        authenticateAs(2L, UserRole.FACILITY_MANAGER, facilityAId);
        assertThat(facilityAccess.canAccessFacility(facilityAId)).isTrue();
        assertThat(facilityAccess.canAccessFacility(facilityBId)).isFalse();

        authenticateAs(3L, UserRole.BUSINESS_MANAGER, null);
        assertThat(facilityAccess.canAccessFacility(facilityBId)).isTrue();

        authenticateAs(4L, UserRole.ADMIN, null);
        assertThat(facilityAccess.canAccessFacility(facilityAId)).isTrue();
        assertThat(facilityAccess.canAccessFacility(facilityBId)).isTrue();

        authenticateAs(5L, UserRole.CUSTOMER, null);
        assertThat(facilityAccess.canAccessFacility(facilityAId)).isFalse();

        SecurityContextHolder.clearContext();
        assertThat(facilityAccess.canAccessFacility(facilityAId)).isFalse();
        assertThatThrownBy(() -> facilityAccess.requireFacilityAccess(facilityAId))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void apiDocsArePubliclyAvailable() throws Exception {
        mvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.info.title").value("Self-Storage Management API"))
                .andExpect(jsonPath("$.paths['/auth/login']").exists());
    }

    @Test
    void ownershipGuardMatchesOnlyTheCurrentUserId() {
        authenticateAs(42L, UserRole.CUSTOMER, null);

        assertThat(ownership.isOwner(42L)).isTrue();
        assertThat(ownership.isOwner(43L)).isFalse();
        assertThatThrownBy(() -> ownership.requireOwnership(43L))
                .isInstanceOf(ForbiddenException.class);

        SecurityContextHolder.clearContext();
        assertThat(ownership.isOwner(42L)).isFalse();
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private void authenticateAs(Long id, UserRole role, Long facilityId) {
        UserPrincipal principal = new UserPrincipal(id, "user-" + id + "@example.com", "unused",
                "User " + id, role, facilityId, UserStatus.ACTIVE);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    private Long insertFacility(String code) {
        jdbc.update("INSERT INTO facilities (code, name, address, status) VALUES (?, ?, ?, 'ACTIVE')",
                code, "Facility " + code, "Test Address " + code);
        return jdbc.queryForObject("SELECT id FROM facilities WHERE code = ?", Long.class, code);
    }

    private String createUserAndLogin(String emailPrefix, UserRole role, Long facilityId) throws Exception {
        String email = emailPrefix + "@example.com";
        jdbc.update("""
                INSERT INTO users (facility_id, full_name, email, password_hash, role, status)
                VALUES (?, ?, ?, ?, ?, 'ACTIVE')
                """, facilityId, "Test " + role, email, passwordEncoder.encode(PASSWORD), role.name());

        MvcResult result = mvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"%s"}
                                """.formatted(email, PASSWORD)))
                .andExpect(status().isOk())
                .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.data.accessToken");
    }
}
