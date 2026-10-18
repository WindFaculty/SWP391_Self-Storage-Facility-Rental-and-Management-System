package com.storage.payment.service;

import com.storage.payment.dto.CustomerBillingDtos.CustomerInvoice;
import com.storage.payment.dto.CustomerBillingDtos.CustomerPaymentAttempt;
import com.storage.payment.entity.Invoice;
import com.storage.payment.entity.PaymentAttempt;
import com.storage.payment.repository.InvoiceRepository;
import com.storage.payment.repository.PaymentAttemptRepository;
import com.storage.shared.exception.BusinessException;
import com.storage.shared.exception.ErrorCode;
import com.storage.shared.exception.NotFoundException;
import com.storage.rental.entity.Rental;
import com.storage.rental.repository.RentalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.storage.shared.web.ClientIp;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
/**
 * Read models for the customer billing pages: the customer's own invoices and
 * the status of a single VNPay attempt. Access is bound to the owning rental,
 * never to a caller-supplied customer id.
 */
@Service
public class CustomerBillingService {

    private final InvoiceRepository invoices;
    private final PaymentAttemptRepository paymentAttempts;
    private final PaymentService paymentService;
    private final RentalRepository rentals;
    private final VnPayService vnPayService;

    public CustomerBillingService(InvoiceRepository invoices,
                                  PaymentAttemptRepository paymentAttempts,
                                  PaymentService paymentService,
                                  RentalRepository rentals,
                                  VnPayService vnPayService) {
        this.invoices = invoices;
        this.paymentAttempts = paymentAttempts;
        this.paymentService = paymentService;
        this.rentals = rentals;
        this.vnPayService = vnPayService;
    }

    @Transactional(readOnly = true)
    public List<CustomerInvoice> myInvoices(Long customerId) {
        List<Long> rentalIds = rentals.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
                .map(com.storage.rental.entity.Rental::getId)
                .toList();
        if (rentalIds.isEmpty()) {
            return List.of();
        }
        return invoices.findByRentalIdInOrderByCreatedAtDesc(rentalIds).stream()
                .map(CustomerInvoice::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<CustomerInvoice> myInvoice(Long customerId, Long invoiceId) {
        return invoices.findById(invoiceId)
                .filter(invoice -> ownsRental(customerId, invoice.getRentalId()))
                .map(CustomerInvoice::from);
    }

    @Transactional(readOnly = true)
    public Optional<CustomerPaymentAttempt> myAttempt(Long customerId, String reference) {
        return paymentAttempts.findByProviderReference(reference)
                .filter(attempt -> ownsRental(customerId, rentalIdOfAttempt(attempt)))
                .map(attempt -> CustomerPaymentAttempt.from(attempt, rentalIdOfAttempt(attempt)));
    }

    @Transactional
    public String createVnPayUrl(Long customerId, Long invoiceId,
                                 jakarta.servlet.http.HttpServletRequest httpRequest) {
        if (!vnPayService.isConfigured()) {
            throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_UNAVAILABLE);
        }
        Invoice invoice = invoices.findById(invoiceId)
                .filter(candidate -> ownsRental(customerId, candidate.getRentalId()))
                .orElseThrow(() -> new NotFoundException(ErrorCode.INVOICE_NOT_FOUND));
        PaymentAttempt attempt = paymentService.startAttempt(invoice.getId(), invoiceTotal(invoice),
                "VNPAY", "VNP-" + invoice.getId() + "-"
                        + java.util.UUID.randomUUID().toString().replace("-", "")
                        .substring(0, 12).toUpperCase(java.util.Locale.ROOT));
        Instant now = Instant.now();
        Instant expiresAt = now.plus(java.time.Duration.ofMinutes(15));
        return vnPayService.createPaymentUrl(attempt, ClientIp.of(httpRequest), now, expiresAt);
    }

    private BigDecimal invoiceTotal(Invoice invoice) {
        return invoice.getAmount().subtract(invoice.getDiscountAmount());
    }

    private boolean ownsRental(Long customerId, Long rentalId) {
        return rentals.findById(rentalId)
                .map(rental -> rental.getCustomerId().equals(customerId))
                .orElse(false);
    }

    private Long rentalIdOfAttempt(PaymentAttempt attempt) {
        return invoices.findById(attempt.getInvoiceId()).map(Invoice::getRentalId).orElse(null);
    }
}
