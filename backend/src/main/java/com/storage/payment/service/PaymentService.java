package com.storage.payment.service;

import com.storage.payment.entity.Invoice;
import com.storage.payment.entity.PaymentAttempt;
import com.storage.payment.repository.InvoiceRepository;
import com.storage.payment.repository.PaymentAttemptRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentAttemptRepository paymentAttemptRepository;

    public PaymentService(InvoiceRepository invoiceRepository,
                          PaymentAttemptRepository paymentAttemptRepository) {
        this.invoiceRepository = invoiceRepository;
        this.paymentAttemptRepository = paymentAttemptRepository;
    }

    @Transactional
    public PaymentAttempt startAttempt(Long invoiceId, BigDecimal amount, String method,
                                       String providerReference) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("invoice not found: " + invoiceId));
        if (invoice.getStatus() != Invoice.Status.PENDING) {
            throw new IllegalStateException("invoice is not payable: " + invoice.getStatus());
        }
        if (amount == null || amount.compareTo(invoice.totalAmount()) != 0) {
            throw new IllegalArgumentException(
                    "attempt amount must equal invoice total " + invoice.totalAmount());
        }
        if (method == null || method.isBlank()
                || providerReference == null || providerReference.isBlank()) {
            throw new IllegalArgumentException("method and providerReference are required");
        }
        if (paymentAttemptRepository.existsByProviderReference(providerReference)) {
            throw new IllegalStateException("duplicate provider reference: " + providerReference);
        }
        return paymentAttemptRepository.save(
                PaymentAttempt.pending(invoice.getId(), amount, method, providerReference));
    }

    // ponytail: gateway checksum/IPN verification is BE3-02/BE3-03; this records an already-verified result.
    @Transactional
    public PaymentAttempt handleGatewayResult(String providerReference, boolean succeeded,
                                              Instant paidAt, String gatewayTransactionNo) {
        PaymentAttempt attempt = paymentAttemptRepository.findByProviderReference(providerReference)
                .orElseThrow(() -> new IllegalArgumentException(
                        "unknown payment attempt: " + providerReference));
        if (!succeeded) {
            attempt.fail();
            return attempt;
        }
        if (!attempt.succeed(paidAt, gatewayTransactionNo)) {
            return attempt;
        }
        Invoice invoice = invoiceRepository.findById(attempt.getInvoiceId())
                .orElseThrow(() -> new IllegalStateException(
                        "invoice missing for attempt " + attempt.getId()));
        // ponytail: late success keeps the invoice untouched; resolution is manual refund (RefundService)
        // or querydr reconcile once BE3-03 sandbox credentials exist.
        invoice.markPaid();
        return attempt;
    }

    @Transactional(readOnly = true)
    public List<PaymentAttempt> paymentHistory(Long rentalId) {
        return paymentAttemptRepository.findByRentalId(rentalId);
    }
}
