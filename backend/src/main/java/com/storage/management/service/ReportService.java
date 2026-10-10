package com.storage.management.service;

import com.storage.management.dto.InvoiceStatusSummary;
import com.storage.management.dto.RevenueReport;
import com.storage.payment.repository.InvoiceRepository;
import com.storage.payment.repository.PaymentAttemptRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportService {

    private final PaymentAttemptRepository paymentAttemptRepository;
    private final InvoiceRepository invoiceRepository;

    public ReportService(PaymentAttemptRepository paymentAttemptRepository,
                         InvoiceRepository invoiceRepository) {
        this.paymentAttemptRepository = paymentAttemptRepository;
        this.invoiceRepository = invoiceRepository;
    }

    @Transactional(readOnly = true)
    public RevenueReport revenue(Instant from, Instant to) {
        if (from == null || to == null || !from.isBefore(to)) {
            throw new IllegalArgumentException("from must be before to");
        }
        PaymentAttemptRepository.AmountCount paid =
                paymentAttemptRepository.summarizeByPaidAt(from, to);
        PaymentAttemptRepository.AmountCount refunded =
                paymentAttemptRepository.summarizeByRefundedAt(from, to);
        return new RevenueReport(paid.getTotal(), paid.getCount(),
                refunded.getTotal(), refunded.getCount());
    }

    @Transactional(readOnly = true)
    public List<InvoiceStatusSummary> invoiceStatusSummary() {
        return invoiceRepository.summarizeByStatus().stream()
                .map(summary -> new InvoiceStatusSummary(
                        summary.getStatus(), summary.getInvoiceCount(), summary.getTotalAmount()))
                .toList();
    }
}
