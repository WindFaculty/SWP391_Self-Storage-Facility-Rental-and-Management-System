package com.storage.payment.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.storage.payment.entity.Invoice;
import com.storage.payment.entity.PaymentAttempt;
import com.storage.payment.repository.InvoiceRepository;
import com.storage.payment.repository.PaymentAttemptRepository;
import com.storage.rental.entity.Rental;
import com.storage.rental.entity.RentalStatus;
import com.storage.rental.repository.RentalRepository;
import com.storage.shared.exception.BusinessException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class CustomerBillingServiceTest {
    @Mock InvoiceRepository invoices;
    @Mock PaymentAttemptRepository attempts;
    @Mock PaymentService payments;
    @Mock RentalRepository rentals;
    @Mock VnPayService gateway;
    CustomerBillingService service;

    @BeforeEach
    void setUp() {
        service = new CustomerBillingService(invoices, attempts, payments, rentals, gateway);
        when(gateway.isConfigured()).thenReturn(true);
    }

    @Test
    void rejectsStalePendingInvoiceForAnExpiredReservation() {
        Rental rental = rental(Instant.now().plusSeconds(120));
        rental.transitionTo(RentalStatus.EXPIRED);
        arrange(invoice(Invoice.Type.RENTAL), rental);

        assertThrows(BusinessException.class, () -> service.createVnPayUrl(1L, 1L, request()));

        verifyNoInteractions(payments);
    }

    @Test
    void rejectsElapsedHoldEvenBeforeTheExpirySchedulerRuns() {
        arrange(invoice(Invoice.Type.RENTAL), rental(Instant.now().minusSeconds(1)));

        assertThrows(BusinessException.class, () -> service.createVnPayUrl(1L, 1L, request()));

        verifyNoInteractions(payments);
    }

    @Test
    void capsGatewayDeadlineAtTheRemainingHoldTime() {
        Instant holdDeadline = Instant.now().plusSeconds(120);
        arrange(invoice(Invoice.Type.RENTAL), rental(holdDeadline));
        PaymentAttempt attempt = PaymentAttempt.pending(1L, new BigDecimal("100.00"), "VNPAY", "reference");
        when(payments.startAttempt(eq(1L), eq(new BigDecimal("100.00")), eq("VNPAY"), any()))
                .thenReturn(attempt);
        when(gateway.createPaymentUrl(eq(attempt), eq("127.0.0.1"), any(), eq(holdDeadline)))
                .thenReturn("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?signed");

        assertEquals("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?signed",
                service.createVnPayUrl(1L, 1L, request()));

        verify(gateway).createPaymentUrl(eq(attempt), eq("127.0.0.1"), any(), eq(holdDeadline));
    }

    @Test
    void rejectsAnAlreadyPaidInvoiceBeforeCreatingAnotherAttempt() {
        Invoice invoice = invoice(Invoice.Type.RENTAL);
        invoice.markPaid();
        arrange(invoice, rental(Instant.now().plusSeconds(120)));

        assertThrows(BusinessException.class, () -> service.createVnPayUrl(1L, 1L, request()));

        verifyNoInteractions(payments);
    }

    @Test
    void allowsRenewalPaymentForAnActiveRentalWithAnOldHoldDeadline() {
        Rental rental = rental(Instant.now().minusSeconds(3600));
        rental.transitionTo(RentalStatus.RESERVED);
        rental.transitionTo(RentalStatus.ACTIVE);
        arrange(invoice(Invoice.Type.RENEWAL), rental);
        PaymentAttempt attempt = PaymentAttempt.pending(1L, new BigDecimal("100.00"), "VNPAY", "renewal");
        when(payments.startAttempt(eq(1L), eq(new BigDecimal("100.00")), eq("VNPAY"), any()))
                .thenReturn(attempt);
        when(gateway.createPaymentUrl(eq(attempt), eq("127.0.0.1"), any(), any())).thenReturn("renewal-url");

        assertEquals("renewal-url", service.createVnPayUrl(1L, 1L, request()));
    }

    private void arrange(Invoice invoice, Rental rental) {
        when(invoices.findById(1L)).thenReturn(Optional.of(invoice));
        when(rentals.findById(1L)).thenReturn(Optional.of(rental));
    }

    private static Invoice invoice(Invoice.Type type) {
        Invoice invoice = Invoice.create(type, 1L, type == Invoice.Type.RENEWAL ? 1L : null, null,
                "Test invoice", new BigDecimal("100.00"), BigDecimal.ZERO, null);
        ReflectionTestUtils.setField(invoice, "id", 1L);
        return invoice;
    }

    private static Rental rental(Instant deadline) {
        return Rental.createHold(1L, 1L, LocalDate.of(2026, 11, 20), LocalDate.of(2026, 12, 20),
                new BigDecimal("100.00"), deadline);
    }

    private static MockHttpServletRequest request() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("127.0.0.1");
        return request;
    }
}
