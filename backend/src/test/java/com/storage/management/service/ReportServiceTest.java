package com.storage.management.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.storage.management.dto.InvoiceStatusSummary;
import com.storage.management.dto.RevenueReport;
import com.storage.payment.entity.Invoice;
import com.storage.payment.repository.InvoiceRepository;
import com.storage.payment.repository.PaymentAttemptRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    private static final Instant FROM = Instant.parse("2026-10-01T00:00:00Z");
    private static final Instant TO = Instant.parse("2026-11-01T00:00:00Z");

    @Mock
    private PaymentAttemptRepository paymentAttemptRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    private ReportService reportService;

    @BeforeEach
    void setUp() {
        reportService = new ReportService(paymentAttemptRepository, invoiceRepository);
    }

    @Test
    void revenueReportCombinesPaidAndRefunded() {
        PaymentAttemptRepository.AmountCount paid =
                mock(PaymentAttemptRepository.AmountCount.class);
        PaymentAttemptRepository.AmountCount refunded =
                mock(PaymentAttemptRepository.AmountCount.class);
        when(paid.getTotal()).thenReturn(new BigDecimal("100.00"));
        when(paid.getCount()).thenReturn(3L);
        when(refunded.getTotal()).thenReturn(new BigDecimal("20.00"));
        when(refunded.getCount()).thenReturn(1L);
        when(paymentAttemptRepository.summarizeByPaidAt(FROM, TO)).thenReturn(paid);
        when(paymentAttemptRepository.summarizeByRefundedAt(FROM, TO)).thenReturn(refunded);

        RevenueReport report = reportService.revenue(FROM, TO);

        assertEquals(new BigDecimal("100.00"), report.paidTotal());
        assertEquals(3L, report.paidCount());
        assertEquals(new BigDecimal("20.00"), report.refundedTotal());
        assertEquals(1L, report.refundedCount());
    }

    @Test
    void rejectsInvalidRange() {
        assertThrows(IllegalArgumentException.class,
                () -> reportService.revenue(TO, FROM));
        assertThrows(IllegalArgumentException.class,
                () -> reportService.revenue(null, TO));
    }

    @Test
    void invoiceStatusSummaryMapsProjections() {
        InvoiceRepository.StatusSummary projection = mock(InvoiceRepository.StatusSummary.class);
        when(projection.getStatus()).thenReturn(Invoice.Status.PAID);
        when(projection.getInvoiceCount()).thenReturn(2L);
        when(projection.getTotalAmount()).thenReturn(new BigDecimal("180.00"));
        when(invoiceRepository.summarizeByStatus()).thenReturn(List.of(projection));

        List<InvoiceStatusSummary> summary = reportService.invoiceStatusSummary();

        assertEquals(List.of(new InvoiceStatusSummary(
                Invoice.Status.PAID, 2L, new BigDecimal("180.00"))), summary);
    }
}
