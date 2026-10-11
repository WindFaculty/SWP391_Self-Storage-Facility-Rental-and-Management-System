package com.storage.facility;

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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
class FacilityManagementTests {

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

    String businessToken;
    String adminToken;
    String customerToken;
    String managerAToken;
    String managerBToken;
    Long facilityAId;
    Long facilityBId;
    Long unitTypeId;
    String facilityACode;
    String suffix;

    @BeforeEach
    void setUp() throws Exception {
        suffix = UUID.randomUUID().toString().substring(0, 6);

        businessToken = createUserAndLogin("business-" + suffix, UserRole.BUSINESS_MANAGER, null);
        adminToken = createUserAndLogin("admin-" + suffix, UserRole.ADMIN, null);
        customerToken = createUserAndLogin("customer-" + suffix, UserRole.CUSTOMER, null);

        facilityACode = "FAC-A-" + suffix;
        facilityAId = createFacilityViaApi(facilityACode);
        facilityBId = createFacilityViaApi("FAC-B-" + suffix);

        managerAToken = createUserAndLogin("manager-a-" + suffix, UserRole.FACILITY_MANAGER, facilityAId);
        managerBToken = createUserAndLogin("manager-b-" + suffix, UserRole.FACILITY_MANAGER, facilityBId);

        String unitTypeName = "Small " + suffix;
        jdbc.update("""
                INSERT INTO unit_types (name, size_m2, min_monthly_price, max_monthly_price, description)
                VALUES (?, 5.00, 100000.00, 200000.00, 'Test size')
                """, unitTypeName);
        unitTypeId = jdbc.queryForObject("SELECT id FROM unit_types WHERE name = ?",
                Long.class, unitTypeName);
    }

    @Test
    void catalogIsPublicAndBusinessOperationsAreRoleGuarded() throws Exception {
        mvc.perform(get("/facilities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].code", hasItem(facilityACode)));

        mvc.perform(get("/facilities/" + facilityAId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.code").value(facilityACode));

        mvc.perform(get("/facilities/" + facilityAId + "/unit-types"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].name", hasItem("Small " + suffix)));

        mvc.perform(post("/management/facilities")
                        .header("Authorization", bearer(customerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(facilityBody(facilityACode)))
                .andExpect(status().isForbidden());

        mvc.perform(post("/management/facilities")
                        .header("Authorization", bearer(managerAToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(facilityBody(facilityACode)))
                .andExpect(status().isForbidden());

        mvc.perform(post("/management/facilities")
                        .header("Authorization", bearer(businessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(facilityBody(facilityACode)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("FACILITY_CODE_EXISTS"));

        mvc.perform(put("/management/facilities/" + facilityAId)
                        .header("Authorization", bearer(businessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"code":"%s","name":"Facility A renamed","address":"New address"}
                                """.formatted(facilityACode)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Facility A renamed"));
    }

    @Test
    void managerCanManageUnitsOnlyInAssignedFacility() throws Exception {
        String unitCode = "U1-" + suffix;
        createUnitViaApi(managerAToken, facilityAId, unitCode, "150000.00");

        mvc.perform(get("/ops/units")
                        .param("facilityId", facilityAId.toString())
                        .header("Authorization", bearer(managerAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[*].unitCode", hasItem(unitCode)));

        mvc.perform(post("/ops/units")
                        .header("Authorization", bearer(managerAToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(unitBody(facilityBId, "UB1-" + suffix, "150000.00")))
                .andExpect(status().isForbidden());

        createUnitViaApi(adminToken, facilityBId, "UB1-" + suffix, "150000.00");

        mvc.perform(post("/ops/units")
                        .header("Authorization", bearer(managerAToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(unitBody(facilityAId, "U2-" + suffix, "500000.00")))
                .andExpect(status().isBadRequest());

        mvc.perform(post("/ops/units")
                        .header("Authorization", bearer(managerAToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(unitBody(facilityAId, unitCode, "150000.00")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("STORAGE_UNIT_CODE_EXISTS"));

        mvc.perform(get("/ops/units")
                        .param("facilityId", facilityBId.toString())
                        .header("Authorization", bearer(managerAToken)))
                .andExpect(status().isForbidden());

        mvc.perform(get("/ops/units")
                        .param("facilityId", facilityAId.toString())
                        .header("Authorization", bearer(customerToken)))
                .andExpect(status().isForbidden());
    }

    @Test
    void unitStatusChangesAreValidatedAndFacilityScoped() throws Exception {
        Long unitId = createUnitViaApi(managerAToken, facilityAId, "US-" + suffix, "150000.00");

        mvc.perform(patch("/ops/units/" + unitId + "/status")
                        .header("Authorization", bearer(managerBToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"MAINTENANCE\"}"))
                .andExpect(status().isForbidden());

        mvc.perform(patch("/ops/units/" + unitId + "/status")
                        .header("Authorization", bearer(managerAToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"INSPECTION\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_UNIT_STATUS_TRANSITION"));

        mvc.perform(patch("/ops/units/" + unitId + "/status")
                        .header("Authorization", bearer(managerAToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"MAINTENANCE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("MAINTENANCE"));

        mvc.perform(patch("/ops/units/" + unitId + "/status")
                        .header("Authorization", bearer(managerAToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"AVAILABLE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("AVAILABLE"));
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private String facilityBody(String code) {
        return """
                {"code":"%s","name":"Facility %s","address":"Test address"}
                """.formatted(code, code);
    }

    private String unitBody(Long facilityId, String unitCode, String monthlyPrice) {
        return """
                {"facilityId":%d,"unitCode":"%s","unitTypeId":%d,"locationLabel":"Block A","monthlyPrice":%s}
                """.formatted(facilityId, unitCode, unitTypeId, monthlyPrice);
    }

    private Long readLong(MvcResult result, String path) throws Exception {
        Number value = JsonPath.read(result.getResponse().getContentAsString(), path);
        return value.longValue();
    }

    private Long createFacilityViaApi(String code) throws Exception {
        MvcResult result = mvc.perform(post("/management/facilities")
                        .header("Authorization", bearer(businessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(facilityBody(code)))
                .andExpect(status().isCreated())
                .andReturn();
        return readLong(result, "$.data.id");
    }

    private Long createUnitViaApi(String token, Long facilityId, String unitCode, String monthlyPrice)
            throws Exception {
        MvcResult result = mvc.perform(post("/ops/units")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(unitBody(facilityId, unitCode, monthlyPrice)))
                .andExpect(status().isCreated())
                .andReturn();
        return readLong(result, "$.data.id");
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
