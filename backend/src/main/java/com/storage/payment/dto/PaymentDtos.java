package com.storage.payment.dto;

import com.storage.payment.entity.PaymentAttempt;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;

public final class PaymentDtos {

    private PaymentDtos() {
    }

    public record CheckoutRequest(@NotNull Long invoiceId) {
    }

    public record CheckoutResponse(String providerReference, String payUrl, Instant expiresAt) {
    }

    public record RefundRequest(@NotBlank String providerReference, @NotBlank String note) {
    }

    public record PaymentAttemptResponse(Long id, Long invoiceId, BigDecimal amount, String method,
                                         String providerReference, String status, Instant paidAt,
                                         String gatewayTransactionNo, Instant refundedAt, String refundNote) {

        public static PaymentAttemptResponse from(PaymentAttempt attempt) {
            return new PaymentAttemptResponse(attempt.getId(), attempt.getInvoiceId(), attempt.getAmount(),
                    attempt.getMethod(), attempt.getProviderReference(), attempt.getStatus().name(),
                    attempt.getPaidAt(), attempt.getGatewayTransactionNo(), attempt.getRefundedAt(),
                    attempt.getRefundNote());
        }
    }
}
