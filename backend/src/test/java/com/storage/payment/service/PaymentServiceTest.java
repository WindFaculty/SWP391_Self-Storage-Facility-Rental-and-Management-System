package com.storage.payment.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.storage.payment.entity.Invoice;
import com.storage.payment.entity.PaymentAttempt;
import com.storage.payment.repository.InvoiceRepository;
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
class PaymentServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private PaymentAttemptRepository paymentAttemptRepository;

    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(invoiceRepository, paymentAttemptRepository);
    }

    private static Invoice pendingRentInvoice() {
        return Invoice.create(Invoice.Type.RENTAL, 1L, null, null, "Rent 1 month",
                new BigDecimal("100.00"), new BigDecimal("10.00"), null);
    }

    @Test
    void startAttemptSnapshotsInvoiceTotal() {
        Invoice invoice = pendingRentInvoice();
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));
        when(paymentAttemptRepository.existsByProviderReference("VNPAY-1")).thenReturn(false);
        when(paymentAttemptRepository.save(any(PaymentAttempt.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        PaymentAttempt attempt = paymentService.startAttempt(
                1L, new BigDecimal("90.00"), "VNPAY", "VNPAY-1");

        assertEquals(PaymentAttempt.Status.PENDING, attempt.getStatus());
        assertEquals(new BigDecimal("90.00"), attempt.getAmount());
        assertEquals("VNPAY-1", attempt.getProviderReference());
        assertEquals(new BigDecimal("90.00"), invoice.totalAmount());
    }

    @Test
    void startAttemptRejectsAmountMismatch() {
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(pendingRentInvoice()));

        assertThrows(IllegalArgumentException.class,
                () -> paymentService.startAttempt(1L, new BigDecimal("89.99"), "VNPAY", "VNPAY-1"));

        verifyNoInteractions(paymentAttemptRepository);
    }

    @Test
    void startAttemptRejectsNonPendingInvoice() {
        Invoice invoice = pendingRentInvoice();
        invoice.markPaid();
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));

        assertThrows(IllegalStateException.class,
                () -> paymentService.startAttempt(1L, new BigDecimal("90.00"), "VNPAY", "VNPAY-1"));

        verifyNoInteractions(paymentAttemptRepository);
    }

    @Test
    void gatewaySuccessMarksInvoicePaidOnce() {
        Invoice invoice = pendingRentInvoice();
        PaymentAttempt attempt = PaymentAttempt.pending(
                1L, new BigDecimal("90.00"), "VNPAY", "VNPAY-1");
        when(paymentAttemptRepository.findByProviderReference("VNPAY-1"))
                .thenReturn(Optional.of(attempt));
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));
        Instant paidAt = Instant.parse("2026-10-10T10:00:00Z");

        paymentService.handleGatewayResult("VNPAY-1", true, paidAt);

        assertEquals(PaymentAttempt.Status.SUCCESS, attempt.getStatus());
        assertEquals(paidAt, attempt.getPaidAt());
        assertEquals(Invoice.Status.PAID, invoice.getStatus());

        paymentService.handleGatewayResult("VNPAY-1", true, paidAt);

        assertEquals(PaymentAttempt.Status.SUCCESS, attempt.getStatus());
        assertEquals(Invoice.Status.PAID, invoice.getStatus());
        verify(invoiceRepository, times(1)).findById(1L);
    }

    @Test
    void gatewayFailureMarksAttemptFailed() {
        PaymentAttempt attempt = PaymentAttempt.pending(
                1L, new BigDecimal("90.00"), "VNPAY", "VNPAY-1");
        when(paymentAttemptRepository.findByProviderReference("VNPAY-1"))
                .thenReturn(Optional.of(attempt));

        paymentService.handleGatewayResult("VNPAY-1", false, null);

        assertEquals(PaymentAttempt.Status.FAILED, attempt.getStatus());
        assertEquals(null, attempt.getPaidAt());
        verifyNoInteractions(invoiceRepository);
    }
}
