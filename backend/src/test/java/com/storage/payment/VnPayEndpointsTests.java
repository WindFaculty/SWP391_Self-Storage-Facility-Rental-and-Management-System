package com.storage.payment;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
class VnPayEndpointsTests {

    @Container
    @ServiceConnection
    static final MySQLContainer MYSQL = new MySQLContainer("mysql:8.4");

    @Autowired
    MockMvc mvc;

    @Test
    void ipnIsPublicAndRejectsForgedChecksum() throws Exception {
        mvc.perform(get("/payments/vnpay/ipn"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.RspCode").value("97"))
                .andExpect(jsonPath("$.Message").value("Invalid signature"));
    }

    @Test
    void returnIsPublicAndReportsChecksumStatus() throws Exception {
        mvc.perform(get("/payments/vnpay/return").param("vnp_TxnRef", "VNP-1-ABCDEF123456"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.txnRef").value("VNP-1-ABCDEF123456"))
                .andExpect(jsonPath("$.checksumVerified").value("false"));
    }

    @Test
    void checkoutRequiresAuthentication() throws Exception {
        mvc.perform(post("/customer/payments/vnpay/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"invoiceId\":1}"))
                .andExpect(status().isUnauthorized());
    }
}
