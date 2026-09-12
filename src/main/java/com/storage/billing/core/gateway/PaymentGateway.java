package com.storage.billing.core.gateway;

import java.math.BigDecimal;

public interface PaymentGateway {
    PaymentResult processPayment(PaymentRequest request);
    PaymentResult verifyPayment(String transactionId);
    PaymentResult refundPayment(String transactionId, BigDecimal amount);
}
