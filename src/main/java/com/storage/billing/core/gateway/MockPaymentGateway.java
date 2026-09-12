package com.storage.billing.core.gateway;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class MockPaymentGateway implements PaymentGateway {

    private static final Logger log = LoggerFactory.getLogger(MockPaymentGateway.class);

    // Cache idempotency results to prevent duplicate charges
    private final Map<String, PaymentResult> idempotencyStore = new ConcurrentHashMap<>();
    private final Map<String, PaymentResult> transactionStore = new ConcurrentHashMap<>();

    @Override
    public PaymentResult processPayment(PaymentRequest request) {
        log.info("[PAYMENT_INITIATED] OrderId: {}, Amount: {}, Currency: {}, IdempotencyKey: {}",
                request.getOrderId(), request.getAmount(), request.getCurrency(), request.getIdempotencyKey());

        // Check idempotency
        if (request.getIdempotencyKey() != null && idempotencyStore.containsKey(request.getIdempotencyKey())) {
            log.info("[PAYMENT_IDEMPOTENT_HIT] Returning stored result for key: {}", request.getIdempotencyKey());
            return idempotencyStore.get(request.getIdempotencyKey());
        }

        // Simulate failure condition: negative or zero amount, or description containing "FAIL"
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0 ||
                (request.getDescription() != null && request.getDescription().toUpperCase().contains("FAIL"))) {
            log.warn("[PAYMENT_FAILED] Payment failed for orderId: {}", request.getOrderId());
            PaymentResult failedResult = PaymentResult.builder()
                    .transactionId(UUID.randomUUID().toString())
                    .orderId(request.getOrderId())
                    .status(PaymentStatus.FAILED)
                    .amount(request.getAmount())
                    .message("Giao dịch thanh toán thất bại (Giả lập lỗi hoặc số tiền không hợp lệ)")
                    .timestamp(Instant.now())
                    .build();

            if (request.getIdempotencyKey() != null) {
                idempotencyStore.put(request.getIdempotencyKey(), failedResult);
            }
            return failedResult;
        }

        // Successful payment
        String transactionId = "TXN-" + UUID.randomUUID().toString().substring(0, 13).toUpperCase();
        PaymentResult successResult = PaymentResult.builder()
                .transactionId(transactionId)
                .orderId(request.getOrderId())
                .status(PaymentStatus.SUCCESS)
                .amount(request.getAmount())
                .message("Thanh toán thành công qua Mock Payment Gateway")
                .timestamp(Instant.now())
                .build();

        log.info("[PAYMENT_SUCCESS] TransactionId: {}, OrderId: {}, Amount: {}",
                transactionId, request.getOrderId(), request.getAmount());

        transactionStore.put(transactionId, successResult);
        if (request.getIdempotencyKey() != null) {
            idempotencyStore.put(request.getIdempotencyKey(), successResult);
        }

        return successResult;
    }

    @Override
    public PaymentResult verifyPayment(String transactionId) {
        return transactionStore.getOrDefault(transactionId, PaymentResult.builder()
                .transactionId(transactionId)
                .status(PaymentStatus.FAILED)
                .message("Không tìm thấy giao dịch")
                .timestamp(Instant.now())
                .build());
    }

    @Override
    public PaymentResult refundPayment(String transactionId, BigDecimal amount) {
        log.info("[PAYMENT_REFUND] Refunding transaction: {}, amount: {}", transactionId, amount);
        PaymentResult refundResult = PaymentResult.builder()
                .transactionId("REF-" + UUID.randomUUID().toString().substring(0, 8))
                .orderId(transactionId)
                .status(PaymentStatus.REFUNDED)
                .amount(amount)
                .message("Hoàn tiền thành công")
                .timestamp(Instant.now())
                .build();
        return refundResult;
    }
}
