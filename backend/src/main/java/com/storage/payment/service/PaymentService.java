package com.storage.payment.service;

import com.storage.payment.entity.Invoice;
import com.storage.payment.entity.PaymentAttempt;
import com.storage.payment.repository.InvoiceRepository;
import com.storage.payment.repository.PaymentAttemptRepository;
import com.storage.rental.entity.Rental;
import com.storage.rental.entity.RentalRenewal;
import com.storage.rental.entity.RentalStatus;
import com.storage.rental.repository.RentalRenewalRepository;
import com.storage.rental.repository.RentalRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentAttemptRepository paymentAttemptRepository;
    private final RentalRepository rentalRepository;
    private final RentalRenewalRepository renewalRepository;

    public PaymentService(InvoiceRepository invoiceRepository,
                          PaymentAttemptRepository paymentAttemptRepository,
                          RentalRepository rentalRepository,
                          RentalRenewalRepository renewalRepository) {
        this.invoiceRepository = invoiceRepository;
        this.paymentAttemptRepository = paymentAttemptRepository;
        this.rentalRepository = rentalRepository;
        this.renewalRepository = renewalRepository;
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
        // Every successful payment routes through here, so a paid hold confirms the
        // reservation and a paid renewal extends the contract. One caller cannot skip it.
        if (invoice.getType() == Invoice.Type.RENTAL) {
            rentalRepository.findById(invoice.getRentalId())
                    .filter(rental -> rental.getStatus() == RentalStatus.PENDING_PAYMENT)
                    .ifPresent(rental -> rental.transitionTo(RentalStatus.RESERVED));
        } else if (invoice.getType() == Invoice.Type.RENEWAL
                && invoice.getRenewalId() != null) {
            renewalRepository.findById(invoice.getRenewalId())
                    .ifPresent(renewal -> rentalRepository.findById(invoice.getRentalId())
                            .ifPresent(rental -> {
                                rental.extendTo(renewal.getRequestedEndDate());
                                renewal.apply(paidAt == null ? Instant.now() : paidAt);
                            }));
        }
        return attempt;
    }

    @Transactional(readOnly = true)
    public List<PaymentAttempt> paymentHistory(Long rentalId) {
        return paymentAttemptRepository.findByRentalId(rentalId);
    }

    @Transactional(readOnly = true)
    public List<PaymentAttempt> attemptsOfInvoice(Long invoiceId) {
        return paymentAttemptRepository.findByInvoiceIdOrderByCreatedAtDesc(invoiceId);
    }
}
