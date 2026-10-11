package com.storage.payment.dto;

import com.storage.payment.entity.Invoice;
import com.storage.payment.entity.PaymentAttempt;

import java.math.BigDecimal;
import java.time.Instant;

public final class CustomerBillingDtos {

    private CustomerBillingDtos() {
    }

    public record VnPayUrlRequest(Long invoiceId) {
    }

    public record VnPayUrlResponse(String paymentUrl) {
    }

    public record CustomerInvoice(Long id, Long rentalId, String type, String status,
                                  BigDecimal amount, BigDecimal discountAmount,
                                  BigDecimal totalAmount, Instant dueAt, Instant issuedAt) {

        public static CustomerInvoice from(Invoice invoice) {
            return new CustomerInvoice(invoice.getId(), invoice.getRentalId(),
                    invoice.getType().name(), invoice.getStatus().name(), invoice.getAmount(),
                    invoice.getDiscountAmount(),
                    invoice.getAmount().subtract(invoice.getDiscountAmount()),
                    invoice.getDueAt(), invoice.getCreatedAt());
        }
    }

    public record CustomerPaymentAttempt(String reference, String status, BigDecimal amount,
                                         Long invoiceId, Long rentalId, Instant createdAt,
                                         Instant paidAt) {

        public static CustomerPaymentAttempt from(PaymentAttempt attempt, Long rentalId) {
            return new CustomerPaymentAttempt(attempt.getProviderReference(),
                    attempt.getStatus().name(), attempt.getAmount(), attempt.getInvoiceId(),
                    rentalId, attempt.getCreatedAt(), attempt.getPaidAt());
        }
    }
}
