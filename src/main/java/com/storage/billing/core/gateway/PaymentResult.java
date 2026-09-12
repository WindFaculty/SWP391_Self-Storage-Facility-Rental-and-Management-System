package com.storage.billing.core.gateway;

import java.math.BigDecimal;
import java.time.Instant;

public class PaymentResult {
    private String transactionId;
    private String orderId;
    private PaymentStatus status;
    private BigDecimal amount;
    private String message;
    private Instant timestamp;

    public PaymentResult() {
    }

    public PaymentResult(String transactionId, String orderId, PaymentStatus status, BigDecimal amount, String message, Instant timestamp) {
        this.transactionId = transactionId;
        this.orderId = orderId;
        this.status = status;
        this.amount = amount;
        this.message = message;
        this.timestamp = timestamp;
    }

    public static PaymentResultBuilder builder() {
        return new PaymentResultBuilder();
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentStatus status) {
        this.status = status;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public static class PaymentResultBuilder {
        private String transactionId;
        private String orderId;
        private PaymentStatus status;
        private BigDecimal amount;
        private String message;
        private Instant timestamp;

        public PaymentResultBuilder transactionId(String transactionId) {
            this.transactionId = transactionId;
            return this;
        }

        public PaymentResultBuilder orderId(String orderId) {
            this.orderId = orderId;
            return this;
        }

        public PaymentResultBuilder status(PaymentStatus status) {
            this.status = status;
            return this;
        }

        public PaymentResultBuilder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        public PaymentResultBuilder message(String message) {
            this.message = message;
            return this;
        }

        public PaymentResultBuilder timestamp(Instant timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        public PaymentResult build() {
            return new PaymentResult(transactionId, orderId, status, amount, message, timestamp);
        }
    }
}
