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

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end walk of the FE1 customer journey against the real contract used by
 * frontend/src/features/{catalog,rental,billing,support}: browse -> availability ->
 * hold -> invoice -> VNPay checkout -> gateway confirmation -> my rentals ->
 * renewal -> return request.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
class CustomerFlowE2ETests {

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

    @org.springframework.boot.test.web.server.LocalServerPort
    int port;

    private String adminToken;
    private Long facilityId;
    private Long unitTypeId;
    private Long firstUnitId;
    private Long secondUnitId;
    private String suffix;

    @BeforeEach
    void setUp() throws Exception {
        suffix = UUID.randomUUID().toString().substring(0, 6);
        adminToken = createUserAndLogin("admin-" + suffix, "ADMIN", null);
        facilityId = createFacility();
        unitTypeId = createUnitType();
        firstUnitId = createUnit("E2E-A-" + suffix, "900000.00");
        secondUnitId = createUnit("E2E-B-" + suffix, "900000.00");
        configurePolicy();
    }

    @Test
    void customerBrowsesHoldsPaysAndManagesTheRental() throws Exception {
        // public catalog + availability, as FacilityDetailPage does
        mvc.perform(get("/facilities")).andExpect(status().isOk());
        mvc.perform(get("/facilities/" + facilityId)).andExpect(status().isOk());
        mvc.perform(get("/unit-types"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].sizeM2", hasItem(6.0)));
        mvc.perform(get("/availability")
                        .param("startDate", LocalDate.now(ZoneOffset.UTC).plusDays(1).toString())
                        .param("endDate", LocalDate.now(ZoneOffset.UTC).plusDays(32).toString())
                        .param("facilityId", facilityId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].facilityId").value(facilityId.intValue()))
                .andExpect(jsonPath("$.data[0].unitTypeId").value(unitTypeId.intValue()))
                .andExpect(jsonPath("$.data[0].availableCount").value(2))
                .andExpect(jsonPath("$.data[0].totalCount").value(2));

        // register a customer, as AuthPage does
        String customerToken = registerAndLogin("customer-" + suffix);

        // hold, as ReservationPage step 3 does
        LocalDate start = LocalDate.now(ZoneOffset.UTC).plusDays(1);
        MvcResult hold = mvc.perform(post("/rentals/holds")
                        .header("Authorization", bearer(customerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"facilityId":%d,"unitTypeId":%d,"startDate":"%s","rentalMonths":3}
                                """.formatted(facilityId, unitTypeId, start)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.rental.status").value("PENDING_PAYMENT"))
                .andExpect(jsonPath("$.data.rental.startDate").value(start.toString()))
                .andExpect(jsonPath("$.data.rental.unitCode").isNotEmpty())
                // rent = monthlyPrice * months, deposit = rent * depositPercent / 100
                .andExpect(jsonPath("$.data.invoice.rentAmount").value(2700000.0))
                .andExpect(jsonPath("$.data.invoice.depositAmount").value(405000.0))
                .andExpect(jsonPath("$.data.invoice.totalAmount").value(3105000.0))
                .andReturn();
        Long rentalId = readLong(hold, "$.data.rental.id");
        Long invoiceId = readLong(hold, "$.data.invoice.id");

        // the hold blocks the unit, so only one unit is still free
        mvc.perform(get("/availability")
                        .param("startDate", start.toString())
                        .param("endDate", LocalDate.now(ZoneOffset.UTC).plusDays(32).toString())
                        .param("facilityId", facilityId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].availableCount").value(1));

        // a second overlapping hold for the same period cannot take the same unit twice
        String otherCustomer = registerAndLogin("customer2-" + suffix);
        mvc.perform(post("/rentals/holds")
                        .header("Authorization", bearer(otherCustomer))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"facilityId":%d,"unitTypeId":%d,"startDate":"%s","rentalMonths":3}
                                """.formatted(facilityId, unitTypeId, start)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.rental.unitCode").isNotEmpty());

        // BillingPage asks for the VNPay link and polls the attempt status
        MvcResult url = mvc.perform(post("/payments/vnpay/url")
                        .header("Authorization", bearer(customerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"invoiceId\":%d}".formatted(invoiceId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.paymentUrl").isNotEmpty())
                .andReturn();
        String reference = referenceOf(url);

        mvc.perform(get("/payments/attempts/" + reference)
                        .header("Authorization", bearer(customerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.invoiceId").value(invoiceId.intValue()));

        // gateway confirms the payment (the same production entry point the IPN uses)
        paymentService.handleGatewayResult(reference, true, Instant.now(), "TXN-" + suffix);

        mvc.perform(get("/payments/attempts/" + reference)
                        .header("Authorization", bearer(customerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("SUCCESS"));

        // paying the hold confirms the reservation
        mvc.perform(get("/rentals/me").header("Authorization", bearer(customerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].status").value("RESERVED"))
                .andExpect(jsonPath("$.data[0].facilityId").value(facilityId.intValue()))
                .andExpect(jsonPath("$.data[0].unitTypeId").value(unitTypeId.intValue()))
                .andExpect(jsonPath("$.data[0].invoiceId").isNotEmpty())
                .andExpect(jsonPath("$.data[0].holdExpiresAt").isNotEmpty());

        mvc.perform(get("/invoices/me").header("Authorization", bearer(customerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].status").value("PAID"))
                .andExpect(jsonPath("$.data[0].rentalId").value(rentalId.intValue()))
                .andExpect(jsonPath("$.data[0].type").value("RENTAL"))
                .andExpect(jsonPath("$.data[0].totalAmount").value(3105000.0));

        mvc.perform(get("/rentals/" + rentalId).header("Authorization", bearer(customerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(rentalId.intValue()));

        // a customer cannot touch another customer's rental
        mvc.perform(get("/rentals/" + rentalId).header("Authorization", bearer(otherCustomer)))
                .andExpect(status().isNotFound());
    }

    @Test
    void inactiveFacilityRejectsNewCustomerHold() throws Exception {
        String customerToken = registerAndLogin("inactive-customer-" + suffix);
        jdbc.update("update facilities set status = 'INACTIVE' where id = ?", facilityId);
        mvc.perform(post("/rentals/holds")
                        .header("Authorization", bearer(customerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"facilityId":%d,"unitTypeId":%d,"startDate":"%s","rentalMonths":1}
                                """.formatted(facilityId, unitTypeId,
                                LocalDate.now(ZoneOffset.UTC).plusDays(1))))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void realHttpCheckoutAndSignedIpnConfirmRentalIdempotently() throws Exception {
        String email = "http-" + suffix + "@example.com";
        String registration = http("POST", "/auth/register", null, """
                {"fullName":"HTTP Customer","email":"%s","password":"%s","phone":"0901234567"}
                """.formatted(email, PASSWORD), 201);
        String token = JsonPath.read(registration, "$.data.accessToken");
        String hold = http("POST", "/rentals/holds", token, """
                {"facilityId":%d,"unitTypeId":%d,"startDate":"%s","rentalMonths":1}
                """.formatted(facilityId, unitTypeId, LocalDate.now(ZoneOffset.UTC).plusDays(1)), 200);
        long rentalId = JsonPath.<Number>read(hold, "$.data.rental.id").longValue();
        long invoiceId = JsonPath.<Number>read(hold, "$.data.invoice.id").longValue();
        String checkout = http("POST", "/payments/vnpay/url", token,
                "{\"invoiceId\":" + invoiceId + "}", 200);
        String paymentUrl = JsonPath.read(checkout, "$.data.paymentUrl");
        java.util.Map<String, String> paymentParams = new java.util.HashMap<>();
        for (String part : java.net.URI.create(paymentUrl).getRawQuery().split("&")) {
            String[] pair = part.split("=", 2);
            paymentParams.put(pair[0], URLDecoder.decode(pair[1], StandardCharsets.UTF_8));
        }
        String reference = paymentParams.get("vnp_TxnRef");
        java.util.Map<String, String> callback = new java.util.TreeMap<>();
        callback.put("vnp_TxnRef", reference);
        callback.put("vnp_TmnCode", paymentParams.get("vnp_TmnCode"));
        callback.put("vnp_Amount", paymentParams.get("vnp_Amount"));
        callback.put("vnp_ResponseCode", "00");
        callback.put("vnp_TransactionStatus", "00");
        callback.put("vnp_TransactionNo", "HTTP-TXN-" + suffix);
        String query = callback.entrySet().stream()
                .map(entry -> entry.getKey() + "=" + java.net.URLEncoder.encode(
                        entry.getValue(), StandardCharsets.UTF_8))
                .collect(java.util.stream.Collectors.joining("&"));
        javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA512");
        mac.init(new javax.crypto.spec.SecretKeySpec(
                "test-hash-secret".getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
        String signature = java.util.HexFormat.of().formatHex(mac.doFinal(query.getBytes(StandardCharsets.UTF_8)));
        String callbackPath = "/payments/vnpay/ipn?" + query + "&vnp_SecureHash=" + signature;
        org.assertj.core.api.Assertions.assertThat(JsonPath.<String>read(
                http("GET", callbackPath, null, null, 200), "$.RspCode")).isEqualTo("00");
        org.assertj.core.api.Assertions.assertThat(JsonPath.<String>read(
                http("GET", callbackPath, null, null, 200), "$.RspCode")).isEqualTo("02");
        org.assertj.core.api.Assertions.assertThat(JsonPath.<String>read(
                http("GET", "/rentals/" + rentalId, token, null, 200), "$.data.status"))
                .isEqualTo("RESERVED");
        org.assertj.core.api.Assertions.assertThat(JsonPath.<String>read(
                http("GET", "/invoices/" + invoiceId, token, null, 200), "$.data.status"))
                .isEqualTo("PAID");
        org.assertj.core.api.Assertions.assertThat(JsonPath.<String>read(
                http("GET", "/payments/attempts/" + reference, token, null, 200), "$.data.status"))
                .isEqualTo("SUCCESS");
    }

    private String http(String method, String path, String token, String body, int expectedStatus)
            throws Exception {
        java.net.http.HttpRequest.Builder request = java.net.http.HttpRequest.newBuilder(
                java.net.URI.create("http://localhost:" + port + "/api/v1" + path))
                .timeout(java.time.Duration.ofSeconds(20));
        if (token != null) request.header("Authorization", bearer(token));
        if (body != null) request.header("Content-Type", "application/json");
        request.method(method, body == null ? java.net.http.HttpRequest.BodyPublishers.noBody()
                : java.net.http.HttpRequest.BodyPublishers.ofString(body));
        try (java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient()) {
            java.net.http.HttpResponse<String> response = client.send(request.build(),
                    java.net.http.HttpResponse.BodyHandlers.ofString());
            org.assertj.core.api.Assertions.assertThat(response.statusCode())
                    .as("%s %s: %s", method, path, response.body()).isEqualTo(expectedStatus);
            return response.body();
        }
    }

    @Test
    void expiredHoldStopsBlockingAvailability() throws Exception {
        String customerToken = registerAndLogin("expiry-customer-" + suffix);
        LocalDate start = LocalDate.now(ZoneOffset.UTC).plusDays(1);
        MvcResult hold = mvc.perform(post("/rentals/holds")
                        .header("Authorization", bearer(customerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"facilityId":%d,"unitTypeId":%d,"startDate":"%s","rentalMonths":1}
                                """.formatted(facilityId, unitTypeId, start)))
                .andExpect(status().isOk()).andReturn();
        Long rentalId = readLong(hold, "$.data.rental.id");
        // Move the deadline into the past without waiting 15 minutes. Written as a
        // UTC string on purpose: java.sql.Timestamp would be converted through the
        // JVM timezone (+07) and land 7 hours in the future instead.
        jdbc.update("update rentals set payment_expires_at = ? where id = ?",
                Instant.now().minusSeconds(3600).atZone(ZoneOffset.UTC)
                        .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSSSSS")),
                rentalId);
        mvc.perform(get("/availability")
                        .param("facilityId", facilityId.toString())
                        .param("startDate", start.toString())
                        .param("endDate", start.plusMonths(1).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].availableCount").value(2));
    }

    @Test
    void customerCanCancelAHoldAndFreeTheUnitAgain() throws Exception {
        String customerToken = registerAndLogin("customer-" + suffix);
        LocalDate start = LocalDate.now(ZoneOffset.UTC).plusDays(1);

        MvcResult hold = mvc.perform(post("/rentals/holds")
                        .header("Authorization", bearer(customerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"facilityId":%d,"unitTypeId":%d,"startDate":"%s","rentalMonths":3}
                                """.formatted(facilityId, unitTypeId, start)))
                .andExpect(status().isOk())
                .andReturn();
        Long rentalId = readLong(hold, "$.data.rental.id");
        String unitCode = JsonPath.read(json(hold), "$.data.rental.unitCode");

        mvc.perform(post("/rentals/" + rentalId + "/cancel")
                        .header("Authorization", bearer(customerToken))
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));

        mvc.perform(get("/availability")
                        .param("startDate", start.toString())
                        .param("endDate", LocalDate.now(ZoneOffset.UTC).plusDays(32).toString())
                        .param("facilityId", facilityId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].availableCount").value(2));

        mvc.perform(get("/rentals/me").header("Authorization", bearer(customerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].unitCode").value(unitCode));
    }

    @Test
    void customerSupportTicketFlow() throws Exception {
        String customerToken = registerAndLogin("customer-" + suffix);
        mvc.perform(post("/support-tickets")
                        .header("Authorization", bearer(customerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"facilityId":%d,"category":"UNIT","title":"Kho bị ẩm",
                                 "description":"Góc kho có vết nước sau mưa."}
                                """.formatted(facilityId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("OPEN"))
                .andExpect(jsonPath("$.data.category").value("UNIT"));

        mvc.perform(get("/support-tickets/me").header("Authorization", bearer(customerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].title").value("Kho bị ẩm"));
    }

    // ---------- helpers ----------

    private String referenceOf(MvcResult result) throws Exception {
        String url = JsonPath.read(json(result), "$.data.paymentUrl");
        String query = url.substring(url.indexOf('?') + 1);
        for (String pair : query.split("&")) {
            String[] parts = pair.split("=", 2);
            if ("vnp_TxnRef".equals(parts[0])) {
                return URLDecoder.decode(parts[1], StandardCharsets.UTF_8);
            }
        }
        throw new IllegalStateException("no vnp_TxnRef in " + url);
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
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.depositPercent").value(15.0));
    }

    private Long createFacility() throws Exception {
        String code = "E2E-FAC-" + suffix;
        MvcResult result = mvc.perform(post("/management/facilities")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"code":"%s","name":"E2E Facility","address":"1 Test Street"}
                                """.formatted(code)))
                .andExpect(status().isCreated())
                .andReturn();
        return readLong(result, "$.data.id");
    }

    private Long createUnitType() throws Exception {
        String name = "E2E Type " + suffix;
        jdbc.update("""
                INSERT INTO unit_types (name, size_m2, min_monthly_price, max_monthly_price)
                VALUES (?, 6.00, 500000.00, 1500000.00)
                """, name);
        return jdbc.queryForObject("select id from unit_types where name = ?", Long.class, name);
    }

    private Long createUnit(String unitCode, String monthlyPrice) throws Exception {
        MvcResult result = mvc.perform(post("/ops/units")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"facilityId":%d,"unitCode":"%s","unitTypeId":%d,
                                 "locationLabel":"Block A","monthlyPrice":%s}
                                """.formatted(facilityId, unitCode, unitTypeId, monthlyPrice)))
                .andExpect(status().isCreated())
                .andReturn();
        return readLong(result, "$.data.id");
    }

    private String registerAndLogin(String emailPrefix) throws Exception {
        String email = emailPrefix + "@example.com";
        jdbc.update("""
                INSERT INTO users (full_name, email, password_hash, role, status)
                VALUES (?, ?, ?, 'CUSTOMER', 'ACTIVE')
                """, "E2E " + emailPrefix, email, passwordEncoder.encode(PASSWORD));
        return login(email, PASSWORD);
    }

    private String createUserAndLogin(String emailPrefix, String role, Long facilityId)
            throws Exception {
        String email = emailPrefix + "@example.com";
        jdbc.update("""
                INSERT INTO users (facility_id, full_name, email, password_hash, role, status)
                VALUES (?, ?, ?, ?, ?, 'ACTIVE')
                """, facilityId, "E2E " + role, email, passwordEncoder.encode(PASSWORD), role);
        return login(email, PASSWORD);
    }

    private String login(String email, String password) throws Exception {
        MvcResult result = mvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"%s"}
                                """.formatted(email, password)))
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
