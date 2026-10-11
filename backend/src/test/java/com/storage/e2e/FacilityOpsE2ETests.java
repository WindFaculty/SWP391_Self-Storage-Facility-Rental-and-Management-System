package com.storage.e2e;

import com.jayway.jsonpath.JsonPath;
import com.storage.payment.service.PaymentService;
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

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;

import static org.hamcrest.Matchers.greaterThan;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end walk of the FE2 facility workspace against the contract used by
 * frontend/src/features/{facility,staff}: units CRUD, staff worklist, handover,
 * active rental, renewal, return request, return, unit inspection, dashboard
 * and revenue series.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
class FacilityOpsE2ETests {

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
    PaymentService paymentService;

    private String adminToken;
    private String managerToken;
    private String staffToken;
    private Long facilityId;
    private Long otherFacilityId;
    private Long unitTypeId;
    private String suffix;

    @BeforeEach
    void setUp() throws Exception {
        suffix = UUID.randomUUID().toString().substring(0, 6);
        adminToken = createUserAndLogin("admin-" + suffix, "ADMIN", null);        facilityId = createFacility();
        otherFacilityId = createFacility();
        unitTypeId = createUnitType();
        configurePolicy();

        Long managerId = insertUser("manager-" + suffix, "FACILITY_MANAGER", facilityId);
        Long staffId = insertUser("staff-" + suffix, "FACILITY_STAFF", facilityId);
        managerToken = login("manager-" + suffix);
        staffToken = login("staff-" + suffix);
    }

    @Test
    void staffRunsTheFullRentalLifecycleThroughTheWorkspace() throws Exception {
        createUnitViaOps("LIFE-A-" + suffix, "900000.00");
        Long secondUnit = createUnitViaOps("LIFE-B-" + suffix, "1200000.00");
        createUnit("LIFE-C-" + suffix, "900000.00");

        // the manager sees the facility units with the summary the toolbar renders
        mvc.perform(get("/ops/units").param("facilityId", facilityId.toString())
                        .header("Authorization", bearer(managerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(3))
                .andExpect(jsonPath("$.data.summary.total").value(3))
                .andExpect(jsonPath("$.data.summary.byStatus.AVAILABLE").value(3));

        // unit CRUD as FacilityUnitsPage does
        MvcResult updated = mvc.perform(put("/ops/units/" + secondUnit)
                        .header("Authorization", bearer(managerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"facilityId":%d,"unitTypeId":%d,"unitCode":"LIFE-B2-%s",
                                 "locationLabel":"Block B","monthlyPrice":1300000.00}
                                """.formatted(facilityId, unitTypeId, suffix)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unitCode").value("LIFE-B2-" + suffix))
                .andReturn();
        Long updatedUnitId = readLong(updated, "$.data.id");

        mvc.perform(patch("/ops/units/" + updatedUnitId + "/status")
                        .header("Authorization", bearer(managerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"MAINTENANCE","reason":"BÃ¡ÂºÂ£o trÃƒÂ¬ Ã„â€˜iÃ¡Â»Âu hÃƒÂ²a"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("MAINTENANCE"));

        // a unit under maintenance is not offered
        mvc.perform(get("/availability")
                        .param("startDate", LocalDate.now(ZoneOffset.UTC).plusDays(1).toString())
                        .param("endDate", LocalDate.now(ZoneOffset.UTC).plusDays(32).toString())
                        .param("facilityId", facilityId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].availableCount").value(2));

        mvc.perform(get("/ops/staff").param("facilityId", facilityId.toString())
                        .header("Authorization", bearer(managerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(greaterThan(1)));

        // customer books and pays, then the unit is reserved
        String customerToken = registerCustomer("customer-" + suffix);
        LocalDate start = LocalDate.now(ZoneOffset.UTC).plusDays(1);
        MvcResult hold = mvc.perform(post("/rentals/holds")
                        .header("Authorization", bearer(customerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"facilityId":%d,"unitTypeId":%d,"startDate":"%s","rentalMonths":3,
                                 "note":"Giao ngoÃƒÂ i giÃ¡Â»Â"}
                                """.formatted(facilityId, unitTypeId, start)))
                .andExpect(status().isOk())
                .andReturn();
        Long rentalId = readLong(hold, "$.data.rental.id");
        Long invoiceId = readLong(hold, "$.data.invoice.id");
        Long heldUnitId = readLong(hold, "$.data.rental.unitId");

        MvcResult url = mvc.perform(post("/payments/vnpay/url")
                        .header("Authorization", bearer(customerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"invoiceId\":%d}".formatted(invoiceId)))
                .andExpect(status().isOk())
                .andReturn();
        paymentService.handleGatewayResult(referenceOf(url), true, Instant.now(), "TXN-" + suffix);

        // manager rental list
        mvc.perform(get("/ops/rentals").param("facilityId", facilityId.toString())
                        .header("Authorization", bearer(managerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.summary.byStatus.RESERVED").value(1))
                .andExpect(jsonPath("$.data.items[0].customerName").isNotEmpty())
                .andExpect(jsonPath("$.data.items[0].customerPhone").isNotEmpty())
                .andExpect(jsonPath("$.data.items[0].unitCode").isNotEmpty())
                .andExpect(jsonPath("$.data.items[0].unitTypeName").isNotEmpty())
                .andExpect(jsonPath("$.data.items[0].paymentState").value("PAID"));

        // manager assigns the handover task, as AssignTaskModal does
        Long staffId = staffIdOfFacility();
        MvcResult task = mvc.perform(post("/ops/tasks")
                        .header("Authorization", bearer(managerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"facilityId":%d,"rentalId":%d,"taskType":"HANDOVER",
                                 "assignedStaffId":%d,"scheduledAt":"%s","notes":"Giao 9h sÃƒÂ¡ng"}
                                """.formatted(facilityId, rentalId, staffId,
                                LocalDate.now(ZoneOffset.UTC).atTime(9, 0).toInstant(ZoneOffset.UTC))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("ASSIGNED"))
                .andExpect(jsonPath("$.data.taskType").value("HANDOVER"))
                .andExpect(jsonPath("$.data.assignedStaffName").isNotEmpty())
                .andReturn();
        Long taskId = readLong(task, "$.data.id");

        // the staff member only sees their own facility's work
        mvc.perform(get("/ops/staff").param("facilityId", otherFacilityId.toString())
                        .header("Authorization", bearer(staffToken)))
                .andExpect(status().isForbidden());

        // staff worklist, as StaffOperationsPage does
        mvc.perform(get("/ops/tasks").param("facilityId", facilityId.toString())
                        .param("day", "today")
                        .header("Authorization", bearer(staffToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(greaterThan(0)))
                .andExpect(jsonPath("$.data.summary.byStatus.ASSIGNED").value(1))
                .andExpect(jsonPath("$.data.summary.byType.HANDOVER").value(1));

        mvc.perform(post("/ops/tasks/" + taskId + "/start")
                        .header("Authorization", bearer(staffToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("IN_PROGRESS"));

        // handover: task done, rental active, unit occupied
        mvc.perform(post("/ops/tasks/" + taskId + "/handover")
                        .header("Authorization", bearer(staffToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"accessMethod":"ACCESS_CARD",
                                 "handoverCondition":"Kho sÃ¡ÂºÂ¡ch, khÃƒÂ³a hoÃ¡ÂºÂ¡t Ã„â€˜Ã¡Â»â„¢ng tÃ¡Â»â€˜t"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.task.status").value("DONE"))
                .andExpect(jsonPath("$.data.rental.status").value("ACTIVE"))
                .andExpect(jsonPath("$.data.rental.accessMethod").value("ACCESS_CARD"))
                .andExpect(jsonPath("$.data.rental.checkedInAt").isNotEmpty());

        mvc.perform(get("/ops/units").param("facilityId", facilityId.toString())
                        .header("Authorization", bearer(managerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.summary.byStatus.OCCUPIED").value(1))
                .andExpect(jsonPath("$.data.summary.byStatus.MAINTENANCE").value(1));

        // customer renews the active contract; the extension lands on payment
        MvcResult renewal = mvc.perform(post("/rentals/" + rentalId + "/renewals")
                        .header("Authorization", bearer(customerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"additionalMonths\":2}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.invoice.status").value("PENDING"))
                .andExpect(jsonPath("$.data.invoice.totalAmount").value(1800000.0))
                .andExpect(jsonPath("$.data.rental.endDate").value(start.plusMonths(3).toString()))
                .andReturn();
        Long renewalInvoiceId = readLong(renewal, "$.data.invoice.id");

        String renewalReference = referenceOf(mvc.perform(post("/payments/vnpay/url")
                .header("Authorization", bearer(customerToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"invoiceId\":%d}".formatted(renewalInvoiceId)))
                .andExpect(status().isOk())
                .andReturn());
        paymentService.handleGatewayResult(renewalReference, true, Instant.now(),
                "TXN-RENEW-" + suffix);

        mvc.perform(get("/rentals/" + rentalId).header("Authorization", bearer(customerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.endDate").value(start.plusMonths(5).toString()));

        mvc.perform(get("/invoices/me").header("Authorization", bearer(customerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].type").value("RENEWAL"));

        // customer requests the return; staff sees the inspection task
        LocalDate returnDate = start.plusMonths(5).plusDays(1);
        mvc.perform(post("/rentals/" + rentalId + "/return-requests")
                        .header("Authorization", bearer(customerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"requestedDate\":\"%s\"}".formatted(returnDate)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.rental.status").value("RETURN_REQUESTED"));

        Long returnTaskId = taskIdForRental(rentalId, "RETURN_INSPECTION", managerToken);
        mvc.perform(get("/ops/tasks").param("facilityId", facilityId.toString())
                        .param("tab", "RETURN_INSPECTION")
                        .header("Authorization", bearer(managerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.summary.byType.RETURN_INSPECTION").value(1));

        // return: rental returned, unit moves to inspection
        mvc.perform(post("/ops/tasks/" + returnTaskId + "/return")
                        .header("Authorization", bearer(staffToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"condition\":\"Kho sÃ¡ÂºÂ¡ch, khÃƒÂ´ng hÃ†Â° hÃ¡Â»Âng\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.task.status").value("DONE"))
                .andExpect(jsonPath("$.data.rental.status").value("RETURNED"))
                .andExpect(jsonPath("$.data.rental.returnCondition").value("Kho sÃ¡ÂºÂ¡ch, khÃƒÂ´ng hÃ†Â° hÃ¡Â»Âng"));

        mvc.perform(get("/ops/units").param("facilityId", facilityId.toString())
                        .header("Authorization", bearer(managerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.summary.byStatus.INSPECTION").value(1))
                .andExpect(jsonPath("$.data.summary.byStatus.OCCUPIED").value(0));

        // inspection task passes and releases the unit
        Long inspectionTaskId = createUnitInspectionTask(rentalId, staffId, returnDate);
        mvc.perform(post("/ops/tasks/" + inspectionTaskId + "/inspection")
                        .header("Authorization", bearer(staffToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"result\":\"PASS\",\"notes\":\"Kho Ã„â€˜Ã¡ÂºÂ¡t chuÃ¡ÂºÂ©n\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.task.status").value("DONE"));

        mvc.perform(get("/ops/units").param("facilityId", facilityId.toString())
                        .header("Authorization", bearer(managerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.summary.byStatus.AVAILABLE").value(2))
                .andExpect(jsonPath("$.data.summary.byStatus.INSPECTION").value(0));

        // dashboard totals the finished lifecycle
        mvc.perform(get("/ops/facilities/" + facilityId + "/dashboard")
                        .header("Authorization", bearer(managerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unitTotal").value(3))
                .andExpect(jsonPath("$.data.unitAvailable").value(2))
                .andExpect(jsonPath("$.data.occupancyRate").isNumber())
                .andExpect(jsonPath("$.data.attention").isArray())
                .andExpect(jsonPath("$.data.expiringRentalList").isArray())
                .andExpect(jsonPath("$.data.occupancyByType[0].name").isNotEmpty());

        mvc.perform(get("/ops/facilities/" + facilityId + "/revenue").param("months", "6")
                        .header("Authorization", bearer(managerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(6))
                .andExpect(jsonPath("$.data[0].label").isNotEmpty());
    }

    @Test
    void facilityScopeIsEnforcedForEveryWorkspaceEndpoint() throws Exception {
        createUnitViaOps("SCOPE-A-" + suffix, "900000.00");
        mvc.perform(get("/ops/units").param("facilityId", otherFacilityId.toString())
                        .header("Authorization", bearer(managerToken)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/ops/rentals").param("facilityId", otherFacilityId.toString())
                        .header("Authorization", bearer(managerToken)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/ops/tickets").param("facilityId", otherFacilityId.toString())
                        .header("Authorization", bearer(managerToken)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/ops/facilities/" + otherFacilityId + "/dashboard")
                        .header("Authorization", bearer(managerToken)))
                .andExpect(status().isForbidden());
    }

    @Test
    void customerCannotOpenTheFacilityWorkspace() throws Exception {
        String customerToken = registerCustomer("customer-" + suffix);
        mvc.perform(get("/ops/units").param("facilityId", facilityId.toString())
                        .header("Authorization", bearer(customerToken)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/ops/facilities/" + facilityId + "/dashboard")
                        .header("Authorization", bearer(customerToken)))
                .andExpect(status().isForbidden());
    }

    @Test
    void supportTicketWorkspaceFlow() throws Exception {
        String customerToken = registerCustomer("customer-" + suffix);
        MvcResult ticket = mvc.perform(post("/support-tickets")
                        .header("Authorization", bearer(customerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"facilityId":%d,"category":"LOCK","title":"MÃ¡ÂºÂ¥t chÃƒÂ¬a khÃƒÂ³a",
                                 "description":"LÃƒÂ m mÃ¡ÂºÂ¥t chÃƒÂ¬a khÃƒÂ³a kho."}
                                """.formatted(facilityId)))
                .andExpect(status().isCreated())
                .andReturn();
        Long ticketId = readLong(ticket, "$.data.id");

        Long staffId = staffIdOfFacility();
        mvc.perform(post("/ops/tickets/" + ticketId + "/assign")
                        .header("Authorization", bearer(managerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"facilityId":%d,"staffId":%d,"notes":"HÃ¡Â»â€” trÃ¡Â»Â£ ngay"}
                                """.formatted(facilityId, staffId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.ticket.assignedStaffName").isNotEmpty())
                .andExpect(jsonPath("$.data.task.taskType").value("SUPPORT"));

        mvc.perform(get("/ops/tickets").param("facilityId", facilityId.toString())
                        .header("Authorization", bearer(managerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.activeCount").value(1))
                .andExpect(jsonPath("$.data.items[0].customerName").isNotEmpty());

        mvc.perform(get("/ops/tickets/" + ticketId)
                        .header("Authorization", bearer(managerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.category").value("LOCK"));

        // resolving then closing, as TicketsPanel expects
        mvc.perform(post("/staff/support-tickets/" + ticketId + "/start")
                        .header("Authorization", bearer(managerToken)))
                .andExpect(status().isOk());
        mvc.perform(post("/staff/support-tickets/" + ticketId + "/resolve")
                        .header("Authorization", bearer(managerToken)))
                .andExpect(status().isOk());
        mvc.perform(post("/ops/tickets/" + ticketId + "/close")
                        .header("Authorization", bearer(managerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CLOSED"));
    }

    // ---------- helpers ----------

    private String referenceOf(MvcResult result) throws Exception {
        String url = JsonPath.read(json(result), "$.data.paymentUrl");
        for (String pair : url.substring(url.indexOf('?') + 1).split("&")) {
            String[] parts = pair.split("=", 2);
            if ("vnp_TxnRef".equals(parts[0])) {
                return java.net.URLDecoder.decode(parts[1],
                        java.nio.charset.StandardCharsets.UTF_8);
            }
        }
        throw new IllegalStateException("no vnp_TxnRef in " + url);
    }

    private Long taskIdForRental(Long rentalId, String taskType, String token) throws Exception {
        MvcResult result = mvc.perform(get("/ops/tasks")
                        .param("facilityId", facilityId.toString())
                        .param("rentalId", rentalId.toString())
                        .param("tab", taskType)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andReturn();
        return readLong(result, "$.data.items[0].id");
    }

    private Long createUnitInspectionTask(Long rentalId, Long staffId, LocalDate day)
            throws Exception {
        MvcResult result = mvc.perform(post("/ops/tasks")
                        .header("Authorization", bearer(managerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"facilityId":%d,"rentalId":%d,"taskType":"UNIT_INSPECTION",
                                 "assignedStaffId":%d,"scheduledAt":"%s"}
                                """.formatted(facilityId, rentalId, staffId,
                                day.atTime(14, 0).toInstant(ZoneOffset.UTC))))
                .andExpect(status().isCreated())
                .andReturn();
        return readLong(result, "$.data.id");
    }

    private Long staffIdOfFacility() {
        return jdbc.queryForObject("""
                select id from users
                where facility_id = ? and role = 'FACILITY_STAFF' and status = 'ACTIVE'
                order by id limit 1
                """, Long.class, facilityId);
    }

    private Long createUnitViaOps(String unitCode, String monthlyPrice) throws Exception {
        MvcResult result = mvc.perform(post("/ops/units")
                        .header("Authorization", bearer(managerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"facilityId":%d,"unitTypeId":%d,"unitCode":"%s",
                                 "locationLabel":"Block A","monthlyPrice":%s}
                                """.formatted(facilityId, unitTypeId, unitCode, monthlyPrice)))
                .andExpect(status().isCreated())
                .andReturn();
        return readLong(result, "$.data.id");
    }

    private Long createUnit(String unitCode, String monthlyPrice) throws Exception {
        MvcResult result = mvc.perform(post("/manager/facilities/" + facilityId + "/units")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"unitCode":"%s","unitTypeId":%d,"locationLabel":"Block A",
                                 "monthlyPrice":%s}
                                """.formatted(unitCode, unitTypeId, monthlyPrice)))
                .andExpect(status().isCreated())
                .andReturn();
        return readLong(result, "$.data.id");
    }

    private void configurePolicy() throws Exception {
        mvc.perform(put("/management/policy")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"depositPercent":15,"renewalNoticeDays":7,"cancellationFee":0,
                                 "returnNoticeDays":7,"overdueGraceDays":3,
                                 "overdueFeePerDay":50000,"maxDiscountPercent":10}
                                """))
                .andExpect(status().isOk());
    }

    private Long createFacility() throws Exception {
        String code = "OPS-FAC-" + suffix + "-" + UUID.randomUUID().toString().substring(0, 4);
        MvcResult result = mvc.perform(post("/business/facilities")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"code":"%s","name":"Ops Facility","address":"2 Test Street"}
                                """.formatted(code)))
                .andExpect(status().isCreated())
                .andReturn();
        return readLong(result, "$.data.id");
    }

    private Long createUnitType() throws Exception {
        MvcResult result = mvc.perform(post("/business/unit-types")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Ops Type %s","sizeM2":8.00,
                                 "minMonthlyPrice":500000.00,"maxMonthlyPrice":1500000.00}
                                """.formatted(suffix)))
                .andExpect(status().isCreated())
                .andReturn();
        return readLong(result, "$.data.id");
    }

    private String createUserAndLogin(String emailPrefix, String role, Long facilityId)
            throws Exception {
        String email = emailPrefix + "@example.com";
        jdbc.update("""
                INSERT INTO users (facility_id, full_name, email, phone, password_hash, role, status)
                VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
                """, facilityId, "Ops " + role, email, "0900000000",
                passwordEncoder.encode(PASSWORD), role);
        return login(emailPrefix);
    }

    private Long insertUser(String emailPrefix, String role, Long facilityId) {
        String email = emailPrefix + "@example.com";
        jdbc.update("""
                INSERT INTO users (facility_id, full_name, email, phone, password_hash, role, status)
                VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
                """, facilityId, "Ops " + role, email, "0900000000",
                passwordEncoder.encode(PASSWORD), role);
        return jdbc.queryForObject("select id from users where email = ?", Long.class, email);
    }

    private String registerCustomer(String emailPrefix) throws Exception {
        insertUser(emailPrefix, "CUSTOMER", null);
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
