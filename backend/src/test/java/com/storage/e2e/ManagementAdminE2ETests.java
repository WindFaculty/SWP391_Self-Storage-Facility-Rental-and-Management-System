package com.storage.e2e;

import com.jayway.jsonpath.JsonPath;
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

import static org.hamcrest.Matchers.greaterThan;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end walk of the FE2 business-manager and admin workspaces against the
 * contract in frontend/src/features/{management,admin}.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
class ManagementAdminE2ETests {

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

    private String adminToken;
    private String businessToken;
    private String customerToken;
    private Long facilityId;
    private Long upgradedUserId;
    private String suffix;

    @BeforeEach
    void setUp() throws Exception {
        suffix = UUID.randomUUID().toString().substring(0, 6);
        adminToken = createUserAndLogin("admin-" + suffix, "ADMIN", null);
        businessToken = createUserAndLogin("business-" + suffix, "BUSINESS_MANAGER", null);
        customerToken = createUserAndLogin("customer-" + suffix, "CUSTOMER", null);
        facilityId = createFacility();
        createUnitType();
    }

    @Test
    void businessManagerRunsPolicyFeesFacilitiesAndReports() throws Exception {
        // policy, as OperationsPoliciesPage does
        mvc.perform(put("/management/policy")
                        .header("Authorization", bearer(businessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"depositPercent":20,"renewalNoticeDays":14,"cancellationFee":100000,
                                 "returnNoticeDays":10,"overdueGraceDays":5,
                                 "overdueFeePerDay":75000,"maxDiscountPercent":15}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.depositPercent").value(20.0))
                .andExpect(jsonPath("$.data.renewalNoticeDays").value(14))
                .andExpect(jsonPath("$.data.cancellationFee").value(100000))
                .andExpect(jsonPath("$.data.updatedAt").isNotEmpty())
                .andExpect(jsonPath("$.data.updatedBy").isNotEmpty());

        mvc.perform(get("/management/policy").header("Authorization", bearer(businessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.maxDiscountPercent").value(15.0));

        // rejecting an out-of-range percentage
        mvc.perform(put("/management/policy")
                        .header("Authorization", bearer(businessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"depositPercent":150,"renewalNoticeDays":14,"cancellationFee":0,
                                 "returnNoticeDays":10,"overdueGraceDays":5,
                                 "overdueFeePerDay":0,"maxDiscountPercent":15}
                                """))
                .andExpect(status().isBadRequest());

        // fee types
        Long feeTypeId = seedFeeType("LATE-" + suffix, "Phí trả muộn", "250000.00");
        mvc.perform(get("/management/fee-types").header("Authorization", bearer(businessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].code").value("LATE-" + suffix))
                .andExpect(jsonPath("$.data[0].active").value(true));

        mvc.perform(put("/management/fee-types/" + feeTypeId)
                        .header("Authorization", bearer(businessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Phí trả muộn (điều chỉnh)","defaultAmount":300000.00,
                                 "active":false}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Phí trả muộn (điều chỉnh)"))
                .andExpect(jsonPath("$.data.defaultAmount").value(300000))
                .andExpect(jsonPath("$.data.active").value(false));

        // facilities, as OperationsFacilitiesPage does
        mvc.perform(get("/management/facilities").header("Authorization", bearer(businessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(greaterThan(0)))
                .andExpect(jsonPath("$.data[0].unitTotal").isNumber())
                .andExpect(jsonPath("$.data[0].occupancyRate").isNumber());

        MvcResult created = mvc.perform(post("/management/facilities")
                        .header("Authorization", bearer(businessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"code":"OPS-NEW-%s","name":"New Facility",
                                 "address":"3 Test Street"}
                                """.formatted(suffix)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andReturn();
        Long newFacilityId = readLong(created, "$.data.id");

        mvc.perform(put("/management/facilities/" + newFacilityId)
                        .header("Authorization", bearer(businessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"code":"OPS-NEW-%s","name":"New Facility renamed",
                                 "address":"4 Test Street"}
                                """.formatted(suffix)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("New Facility renamed"));

        mvc.perform(patch("/management/facilities/" + newFacilityId + "/status")
                        .header("Authorization", bearer(businessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"INACTIVE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("INACTIVE"));

        // reports, as OperationsReportsPage does
        mvc.perform(get("/management/reports").param("period", "year")
                        .header("Authorization", bearer(businessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.revenuePoints.length()").value(12))
                .andExpect(jsonPath("$.data.rows.length()").value(greaterThan(0)))
                .andExpect(jsonPath("$.data.rows[0].unitTotal").isNumber())
                .andExpect(jsonPath("$.data.occupancyRate").isNumber())
                .andExpect(jsonPath("$.data.activeRentals").isNumber());

        mvc.perform(get("/management/reports").param("period", "quarter")
                        .param("facilityId", facilityId.toString())
                        .header("Authorization", bearer(businessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.revenuePoints.length()").value(3))
                .andExpect(jsonPath("$.data.rows.length()").value(1));
    }

    @Test
    void adminManagesUsersAndReadsActivityLogs() throws Exception {
        Long staffId = insertUser("staff-" + suffix, "FACILITY_STAFF", facilityId);
        String staffToken = login("staff-" + suffix);

        mvc.perform(get("/admin/users")
                        .header("Authorization", bearer(adminToken))
                        .param("search", "staff-" + suffix))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.items[0].email")
                        .value("staff-" + suffix + "@example.com"))
                .andExpect(jsonPath("$.data.items[0].phone").isNotEmpty())
                .andExpect(jsonPath("$.data.items[0].facilityId").value(facilityId.intValue()))
                .andExpect(jsonPath("$.data.summary.total").isNumber())
                .andExpect(jsonPath("$.data.summary.active").isNumber())
                .andExpect(jsonPath("$.data.summary.elevated").isNumber());

        mvc.perform(get("/admin/users")
                        .header("Authorization", bearer(adminToken))
                        .param("role", "FACILITY_STAFF"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(1));

        // create a user without a password, as the FE2 form does
        MvcResult created = mvc.perform(post("/admin/users")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"New Manager","email":"new-%s@example.com",
                                 "phone":"0911111111","role":"FACILITY_MANAGER",
                                 "facilityId":%d}
                                """.formatted(suffix, facilityId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.role").value("FACILITY_MANAGER"))
                .andExpect(jsonPath("$.data.phone").value("0911111111"))
                .andReturn();
        Long newUserId = readLong(created, "$.data.id");

        // update the account, as the same form does when editing
        mvc.perform(put("/admin/users/" + newUserId)
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"New Manager Renamed",
                                 "email":"new-%s@example.com","phone":"0922222222",
                                 "role":"FACILITY_MANAGER","facilityId":%d}
                                """.formatted(suffix, facilityId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName").value("New Manager Renamed"))
                .andExpect(jsonPath("$.data.phone").value("0922222222"));

        // a facility role without a facility is rejected
        mvc.perform(put("/admin/users/" + newUserId)
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"Broken","email":"broken-%s@example.com","phone":null,
                                 "role":"FACILITY_MANAGER","facilityId":null}
                                """.formatted(suffix)))
                .andExpect(status().isBadRequest());

        // duplicate email is rejected
        mvc.perform(post("/admin/users")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"Duplicate","email":"new-%s@example.com","phone":null,
                                 "role":"CUSTOMER","facilityId":null}
                                """.formatted(suffix)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("EMAIL_ALREADY_EXISTS"));

        // PATCH status, as the FE2 form does
        mvc.perform(patch("/admin/users/" + newUserId + "/status")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DISABLED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("DISABLED"));

        mvc.perform(patch("/admin/users/" + newUserId + "/status")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ACTIVE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));

        // an admin cannot disable their own account
        Long adminId = readLong(mvc.perform(get("/auth/me")
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk()).andReturn(), "$.data.id");
        mvc.perform(put("/admin/users/" + adminId + "/status")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DISABLED\"}"))
                .andExpect(status().isBadRequest());

        // activity logs, as AdminSecurityPage renders them
        mvc.perform(get("/admin/activity-logs")
                        .header("Authorization", bearer(adminToken))
                        .param("action", "USER_CREATED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].action").value("USER_CREATED"))
                .andExpect(jsonPath("$.data[0].actorName").isNotEmpty())
                .andExpect(jsonPath("$.data[0].entityType").value("USER"))
                .andExpect(jsonPath("$.data[0].ipAddress").isNotEmpty())
                .andExpect(jsonPath("$.data[0].detail").value("USER_CREATED"));

        mvc.perform(get("/admin/activity-logs")
                        .header("Authorization", bearer(adminToken))
                        .param("search", "admin-" + suffix))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(greaterThan(0)));

        mvc.perform(get("/admin/activity-logs")
                        .header("Authorization", bearer(staffToken)))
                .andExpect(status().isForbidden());
    }

    @Test
    void rolePrefixesGuardEveryWorkspace() throws Exception {
        mvc.perform(get("/management/policy").header("Authorization", bearer(customerToken)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/management/facilities").header("Authorization", bearer(customerToken)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/admin/users").header("Authorization", bearer(businessToken)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/admin/users").header("Authorization", bearer(customerToken)))
                .andExpect(status().isForbidden());

        // an admin is allowed into the facility and business workspaces
        mvc.perform(get("/ops/facilities").header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk());
        mvc.perform(get("/management/facilities").header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk());
        mvc.perform(get("/ops/facilities/" + facilityId + "/revenue")
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk());
    }

    @Test
    void customerCannotSeeAnotherCustomersBilling() throws Exception {
        String otherCustomer = createUserAndLogin("customer2-" + suffix, "CUSTOMER", null);
        mvc.perform(get("/invoices/me").header("Authorization", bearer(customerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));
        mvc.perform(get("/invoices/me").header("Authorization", bearer(otherCustomer)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));
        mvc.perform(get("/payments/attempts/UNKNOWN-" + suffix)
                        .header("Authorization", bearer(customerToken)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/invoices/999999").header("Authorization", bearer(customerToken)))
                .andExpect(status().isNotFound());
    }

    // ---------- helpers ----------

    private Long seedFeeType(String code, String name, String amount) {
        Long existing = jdbc.queryForList(
                "select id from fee_types where code = ?", Long.class, code).stream()
                .findFirst().orElse(null);
        if (existing != null) {
            return existing;
        }
        jdbc.update("insert into fee_types (code, name, default_amount, active) values (?, ?, ?, true)",
                code, name, new java.math.BigDecimal(amount));
        return jdbc.queryForObject("select id from fee_types where code = ?", Long.class, code);
    }

    private Long createFacility() throws Exception {
        String code = "ADM-FAC-" + suffix;
        MvcResult result = mvc.perform(post("/management/facilities")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"code":"%s","name":"Admin Facility","address":"5 Test Street"}
                                """.formatted(code)))
                .andExpect(status().isCreated())
                .andReturn();
        return readLong(result, "$.data.id");
    }

    private void createUnitType() throws Exception {
        jdbc.update("""
                INSERT INTO unit_types (name, size_m2, min_monthly_price, max_monthly_price)
                VALUES (?, 5.00, 500000.00, 1500000.00)
                """, "Admin Type " + suffix);
    }

    private Long insertUser(String emailPrefix, String role, Long facilityId) {
        String email = emailPrefix + "@example.com";
        jdbc.update("""
                INSERT INTO users (facility_id, full_name, email, phone, password_hash, role, status)
                VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
                """, facilityId, "Admin " + role, email, "0900000000",
                passwordEncoder.encode(PASSWORD), role);
        return jdbc.queryForObject("select id from users where email = ?", Long.class, email);
    }

    private String createUserAndLogin(String emailPrefix, String role, Long facilityId)
            throws Exception {
        insertUser(emailPrefix, role, facilityId);
        return login(emailPrefix);
    }

    private String login(String emailPrefix) throws Exception {
        MvcResult result = mvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s@example.com","password":"%s"}
                                """.formatted(emailPrefix, PASSWORD)))
                .andExpect(status().isOk())
                .andReturn();
        return JsonPath.read(json(result), "$.data.accessToken");
    }

    private static String json(MvcResult result) throws Exception {
        return result.getResponse().getContentAsString();
    }

    private static Long readLong(MvcResult result, String path) throws Exception {
        return JsonPath.<Number>read(json(result), path).longValue();
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }
}
