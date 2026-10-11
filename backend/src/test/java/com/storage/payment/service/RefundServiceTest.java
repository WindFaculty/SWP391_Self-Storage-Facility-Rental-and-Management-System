package com.storage.payment.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.storage.payment.entity.PaymentAttempt;
import com.storage.payment.repository.PaymentAttemptRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RefundServiceTest {

    @Mock
    private PaymentAttemptRepository paymentAttemptRepository;

    private RefundService refundService;

    @BeforeEach
    void setUp() {
        refundService = new RefundService(paymentAttemptRepository);
    }

    private static PaymentAttempt successfulAttempt() {
        PaymentAttempt attempt = PaymentAttempt.pending(
                1L, new BigDecimal("90.00"), "VNPAY", "12345678");
        attempt.succeed(Instant.parse("2026-10-10T03:05:00Z"), "14226112");
        return attempt;
    }

    @Test
    void recordsManualRefundForSuccessfulAttempt() {
        PaymentAttempt attempt = successfulAttempt();
        when(paymentAttemptRepository.findByProviderReference("12345678"))
                .thenReturn(Optional.of(attempt));
        Instant refundedAt = Instant.parse("2026-10-12T08:00:00Z");

        PaymentAttempt refunded = refundService.recordManualRefund(
                "12345678", 9L, "Customer cancelled before move-in", refundedAt);

        assertEquals(PaymentAttempt.Status.REFUNDED, refunded.getStatus());
        assertEquals(refundedAt, refunded.getRefundedAt());
        assertEquals(9L, refunded.getRefundedByUserId());
        assertEquals("Customer cancelled before move-in", refunded.getRefundNote());
    }

    @Test
    void rejectsPendingAttempt() {
        PaymentAttempt attempt = PaymentAttempt.pending(
                1L, new BigDecimal("90.00"), "VNPAY", "12345678");
        when(paymentAttemptRepository.findByProviderReference("12345678"))
                .thenReturn(Optional.of(attempt));

        assertThrows(IllegalStateException.class, () -> refundService.recordManualRefund(
                "12345678", 9L, "reason", null));

        assertEquals(PaymentAttempt.Status.PENDING, attempt.getStatus());
    }

    @Test
    void rejectsSecondRefund() {
        PaymentAttempt attempt = successfulAttempt();
        attempt.refund(Instant.parse("2026-10-12T08:00:00Z"), 9L, "first");
        when(paymentAttemptRepository.findByProviderReference("12345678"))
                .thenReturn(Optional.of(attempt));

        assertThrows(IllegalStateException.class, () -> refundService.recordManualRefund(
                "12345678", 9L, "second", null));
    }

    @Test
    void requiresAuditFields() {
        assertThrows(IllegalArgumentException.class, () -> refundService.recordManualRefund(
                "12345678", null, "reason", null));
        assertThrows(IllegalArgumentException.class, () -> refundService.recordManualRefund(
                "12345678", 9L, " ", null));

        verifyNoInteractions(paymentAttemptRepository);
    }
}
