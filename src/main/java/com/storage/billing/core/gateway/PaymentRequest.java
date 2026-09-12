package com.storage.billing.core.gateway;

import java.math.BigDecimal;

public class PaymentRequest {
    private String orderId;
    private BigDecimal amount;
    private String currency = "VND";
    private String idempotencyKey;
    private String description;

    public PaymentRequest() {
    }

    public PaymentRequest(String orderId, BigDecimal amount, String currency, String idempotencyKey, String description) {
        this.orderId = orderId;
        this.amount = amount;
        this.currency = currency != null ? currency : "VND";
        this.idempotencyKey = idempotencyKey;
        this.description = description;
    }

    public static PaymentRequestBuilder builder() {
        return new PaymentRequestBuilder();
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public static class PaymentRequestBuilder {
        private String orderId;
        private BigDecimal amount;
        private String currency = "VND";
        private String idempotencyKey;
        private String description;

        public PaymentRequestBuilder orderId(String orderId) {
            this.orderId = orderId;
            return this;
        }

        public PaymentRequestBuilder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        public PaymentRequestBuilder currency(String currency) {
            this.currency = currency;
            return this;
        }

        public PaymentRequestBuilder idempotencyKey(String idempotencyKey) {
            this.idempotencyKey = idempotencyKey;
            return this;
        }

        public PaymentRequestBuilder description(String description) {
            this.description = description;
            return this;
        }

        public PaymentRequest build() {
            return new PaymentRequest(orderId, amount, currency, idempotencyKey, description);
        }
    }
}
