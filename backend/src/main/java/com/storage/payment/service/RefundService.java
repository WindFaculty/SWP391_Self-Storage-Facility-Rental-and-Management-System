package com.storage.payment.service;

import com.storage.payment.entity.PaymentAttempt;
import com.storage.payment.repository.PaymentAttemptRepository;
import java.time.Instant;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class RefundService {

    private final PaymentAttemptRepository paymentAttemptRepository;

    public RefundService(PaymentAttemptRepository paymentAttemptRepository) {
        this.paymentAttemptRepository = paymentAttemptRepository;
    }

    // ponytail: manual refund recorded after staff completes the actual transfer (D08 default).
    // No VNPay refund API call here, so REFUNDED is never set without human confirmation.
    @Transactional
    public PaymentAttempt recordManualRefund(String providerReference, Long refundedByUserId,
                                             String note, Instant refundedAt) {
        if (refundedByUserId == null || !StringUtils.hasText(note)) {
            throw new IllegalArgumentException("refundedByUserId and note are required");
        }
        PaymentAttempt attempt = paymentAttemptRepository.findByProviderReference(providerReference)
                .orElseThrow(() -> new IllegalArgumentException(
                        "unknown payment attempt: " + providerReference));
        if (!attempt.refund(refundedAt == null ? Instant.now() : refundedAt, refundedByUserId, note)) {
            throw new IllegalStateException(
                    "only a SUCCESS payment can be refunded: " + attempt.getStatus());
        }
        return attempt;
    }
}
