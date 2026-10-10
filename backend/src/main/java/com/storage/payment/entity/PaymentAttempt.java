package com.storage.payment.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "payment_attempts")
public class PaymentAttempt {

    public enum Status { PENDING, SUCCESS, FAILED, REFUNDED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "invoice_id", nullable = false)
    private Long invoiceId;

    @Column(name = "amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "method", nullable = false, length = 30)
    private String method;

    @Column(name = "provider_reference", length = 120)
    private String providerReference;

    @Column(name = "gateway_transaction_no", length = 120)
    private String gatewayTransactionNo;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 12)
    private Status status;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "refunded_at")
    private Instant refundedAt;

    @Column(name = "refunded_by_user_id")
    private Long refundedByUserId;

    @Column(name = "refund_note", length = 255)
    private String refundNote;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected PaymentAttempt() {
    }

    public static PaymentAttempt pending(Long invoiceId, BigDecimal amount, String method,
                                         String providerReference) {
        PaymentAttempt attempt = new PaymentAttempt();
        attempt.invoiceId = invoiceId;
        attempt.amount = amount;
        attempt.method = method;
        attempt.providerReference = providerReference;
        attempt.status = Status.PENDING;
        attempt.createdAt = Instant.now();
        return attempt;
    }

    public boolean succeed(Instant paidAt, String gatewayTransactionNo) {
        if (status != Status.PENDING) {
            return false;
        }
        status = Status.SUCCESS;
        this.paidAt = paidAt;
        this.gatewayTransactionNo = gatewayTransactionNo;
        return true;
    }

    public boolean fail() {
        if (status != Status.PENDING) {
            return false;
        }
        status = Status.FAILED;
        return true;
    }

    public boolean refund(Instant refundedAt, Long refundedByUserId, String note) {
        if (status != Status.SUCCESS) {
            return false;
        }
        status = Status.REFUNDED;
        this.refundedAt = refundedAt;
        this.refundedByUserId = refundedByUserId;
        this.refundNote = note;
        return true;
    }

    public Long getId() {
        return id;
    }

    public Long getInvoiceId() {
        return invoiceId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getMethod() {
        return method;
    }

    public String getProviderReference() {
        return providerReference;
    }

    public String getGatewayTransactionNo() {
        return gatewayTransactionNo;
    }

    public Status getStatus() {
        return status;
    }

    public Instant getPaidAt() {
        return paidAt;
    }

    public Instant getRefundedAt() {
        return refundedAt;
    }

    public Long getRefundedByUserId() {
        return refundedByUserId;
    }

    public String getRefundNote() {
        return refundNote;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
