package com.storage.payment.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.storage.payment.config.VnPayProperties;
import com.storage.payment.entity.PaymentAttempt;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class VnPayServiceTest {

    private static final String PAY_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    private static final String RETURN_URL = "https://example.com/api/v1/payments/vnpay/return";
    private static final Instant CREATED_AT = Instant.parse("2026-10-10T03:00:00Z");
    private static final Instant EXPIRES_AT = Instant.parse("2026-10-10T03:15:00Z");

    // Independently computed with .NET HMAC-SHA512 for the same canonical query string.
    private static final String EXPECTED_URL = """
            https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=9000&vnp_Command=pay&vnp_CreateDate=20261010100000\
            &vnp_CurrCode=VND&vnp_ExpireDate=20261010101500&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+hoa+don+1\
            &vnp_OrderType=other&vnp_ReturnUrl=https%3A%2F%2Fexample.com%2Fapi%2Fv1%2Fpayments%2Fvnpay%2Freturn\
            &vnp_TmnCode=DEMOV210&vnp_TxnRef=12345678&vnp_Version=2.1.0&vnp_SecureHash=130494868df16440ae4a85806b1e0aec9baa1d4da453b31412dfac2a338509d7f7938577933e20515acb402368fa3d18d387ca02d3186303d3f5d1e090c358f8""";

    private VnPayService vnPayService;

    @BeforeEach
    void setUp() {
        vnPayService = new VnPayService(
                new VnPayProperties("DEMOV210", "TEST_HASH_SECRET", PAY_URL, RETURN_URL));
    }

    @Test
    void buildsSignedSandboxPaymentUrl() {
        PaymentAttempt attempt = attempt(new BigDecimal("90.00"));

        String url = vnPayService.createPaymentUrl(attempt, "127.0.0.1", CREATED_AT, EXPIRES_AT);

        assertEquals(EXPECTED_URL, url);
    }

    @Test
    void multipliesAmountByHundred() {
        PaymentAttempt attempt = attempt(new BigDecimal("1.00"));

        String url = vnPayService.createPaymentUrl(attempt, "127.0.0.1", CREATED_AT, EXPIRES_AT);

        assertTrue(url.contains("vnp_Amount=100&vnp_Command=pay"));
    }

    @Test
    void rejectsNonPendingAttempt() {
        PaymentAttempt attempt = attempt(new BigDecimal("90.00"));
        attempt.succeed(CREATED_AT, "14226112");

        assertThrows(IllegalStateException.class,
                () -> vnPayService.createPaymentUrl(attempt, "127.0.0.1", CREATED_AT, EXPIRES_AT));
    }

    @Test
    void rejectsIncompleteConfiguration() {
        assertThrows(IllegalStateException.class,
                () -> new VnPayService(new VnPayProperties("", "secret", PAY_URL, RETURN_URL)));
    }

    @Test
    void verifiesIpnChecksumAndRejectsTamperedParams() {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_Amount", "9000");
        params.put("vnp_BankCode", "NCB");
        params.put("vnp_Command", "pay");
        params.put("vnp_CreateDate", "20261010100000");
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_ExpireDate", "20261010101500");
        params.put("vnp_IpAddr", "127.0.0.1");
        params.put("vnp_Locale", "vn");
        params.put("vnp_OrderInfo", "Thanh toan hoa don 1");
        params.put("vnp_OrderType", "other");
        params.put("vnp_PayDate", "20261010100500");
        params.put("vnp_ResponseCode", "00");
        params.put("vnp_ReturnUrl", RETURN_URL);
        params.put("vnp_TmnCode", "DEMOV210");
        params.put("vnp_TransactionNo", "14226112");
        params.put("vnp_TransactionStatus", "00");
        params.put("vnp_TxnRef", "12345678");
        params.put("vnp_Version", "2.1.0");
        // Independently computed with .NET HMAC-SHA512 over the sorted, URL-encoded query string.
        params.put("vnp_SecureHash",
                "f98ef00d55325d47e73ec6db132665f03bf09b329aeb223af196d9691f51c85c65789ade58da6a941555b828c75d3477af49ae3a5374cdb85dd14f980e65878c");

        assertTrue(vnPayService.verifyChecksum(params));

        params.put("vnp_Amount", "8900");
        assertFalse(vnPayService.verifyChecksum(params));
    }

    @Test
    void rejectsMissingChecksum() {
        assertFalse(vnPayService.verifyChecksum(Map.of("vnp_TxnRef", "12345678")));
    }

    @Test
    void parsesPayDateInGmt7() {
        assertEquals(Instant.parse("2026-10-10T03:05:00Z"),
                vnPayService.parsePayDate("20261010100500"));
        assertNull(vnPayService.parsePayDate(""));
    }

    private static PaymentAttempt attempt(BigDecimal amount) {
        PaymentAttempt attempt = PaymentAttempt.pending(1L, amount, "VNPAY", "12345678");
        return attempt;
    }
}
