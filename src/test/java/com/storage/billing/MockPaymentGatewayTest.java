package com.storage.billing;

import com.storage.billing.core.gateway.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class MockPaymentGatewayTest {

    private PaymentGateway paymentGateway;

    @BeforeEach
    void setUp() {
        paymentGateway = new MockPaymentGateway();
    }

    @Test
    @DisplayName("BE3: Mock Payment SUCCESS")
    void testProcessPaymentSuccess() {
        PaymentRequest request = PaymentRequest.builder()
                .orderId("ORD-1001")
                .amount(new BigDecimal("1500000"))
                .currency("VND")
                .idempotencyKey("IDEM-KEY-001")
                .description("Thanh toán tiền thuê kho")
                .build();

        PaymentResult result = paymentGateway.processPayment(request);

        assertNotNull(result);
        assertEquals(PaymentStatus.SUCCESS, result.getStatus());
        assertEquals("ORD-1001", result.getOrderId());
        assertNotNull(result.getTransactionId());
        assertTrue(result.getTransactionId().startsWith("TXN-"));
    }

    @Test
    @DisplayName("BE3: Mock Payment FAILURE on negative amount or simulated error")
    void testProcessPaymentFailure() {
        PaymentRequest request = PaymentRequest.builder()
                .orderId("ORD-1002")
                .amount(new BigDecimal("-50000"))
                .currency("VND")
                .idempotencyKey("IDEM-KEY-002")
                .description("Số tiền âm")
                .build();

        PaymentResult result = paymentGateway.processPayment(request);

        assertNotNull(result);
        assertEquals(PaymentStatus.FAILED, result.getStatus());
    }

    @Test
    @DisplayName("BE3: Payment Idempotency preserves previous result")
    void testPaymentIdempotency() {
        PaymentRequest request = PaymentRequest.builder()
                .orderId("ORD-1003")
                .amount(new BigDecimal("2000000"))
                .currency("VND")
                .idempotencyKey("IDEM-REPEAT-KEY")
                .description("Thanh toán lặp lại")
                .build();

        PaymentResult firstResult = paymentGateway.processPayment(request);
        PaymentResult secondResult = paymentGateway.processPayment(request);

        assertEquals(firstResult.getTransactionId(), secondResult.getTransactionId());
        assertEquals(firstResult.getTimestamp(), secondResult.getTimestamp());
    }

    @Test
    @DisplayName("BE3: Refund payment success")
    void testRefundPayment() {
        PaymentResult refund = paymentGateway.refundPayment("TXN-12345", new BigDecimal("500000"));
        assertNotNull(refund);
        assertEquals(PaymentStatus.REFUNDED, refund.getStatus());
        assertTrue(refund.getTransactionId().startsWith("REF-"));
    }
}
