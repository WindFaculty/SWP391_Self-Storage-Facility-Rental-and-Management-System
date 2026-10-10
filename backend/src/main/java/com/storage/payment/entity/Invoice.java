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
@Table(name = "invoices")
public class Invoice {

    public enum Type { DEPOSIT, RENTAL, RENEWAL, EXTRA, OVERDUE }

    public enum Status { PENDING, PAID, WAIVED, CANCELLED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rental_id", nullable = false)
    private Long rentalId;

    @Column(name = "renewal_id")
    private Long renewalId;

    @Column(name = "fee_type_id")
    private Long feeTypeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "invoice_type", nullable = false, length = 12)
    private Type type;

    @Column(name = "description")
    private String description;

    @Column(name = "amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "discount_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal discountAmount;

    @Column(name = "due_at")
    private Instant dueAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 12)
    private Status status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Invoice() {
    }

    public static Invoice create(Type type, Long rentalId, Long renewalId, Long feeTypeId,
                                 String description, BigDecimal amount, BigDecimal discountAmount,
                                 Instant dueAt) {
        if (type == null || rentalId == null) {
            throw new IllegalArgumentException("type and rentalId are required");
        }
        if (amount == null || amount.signum() < 0) {
            throw new IllegalArgumentException("amount must be >= 0");
        }
        BigDecimal discount = discountAmount == null ? BigDecimal.ZERO : discountAmount;
        if (discount.signum() < 0 || discount.compareTo(amount) > 0) {
            throw new IllegalArgumentException("discountAmount must be between 0 and amount");
        }
        if ((type == Type.RENEWAL) != (renewalId != null)) {
            throw new IllegalArgumentException("renewalId is required only for RENEWAL invoices");
        }
        if (type == Type.EXTRA && feeTypeId == null) {
            throw new IllegalArgumentException("feeTypeId is required for EXTRA invoices");
        }
        Invoice invoice = new Invoice();
        invoice.type = type;
        invoice.rentalId = rentalId;
        invoice.renewalId = renewalId;
        invoice.feeTypeId = feeTypeId;
        invoice.description = description;
        invoice.amount = amount;
        invoice.discountAmount = discount;
        invoice.dueAt = dueAt;
        invoice.status = Status.PENDING;
        invoice.createdAt = Instant.now();
        return invoice;
    }

    public BigDecimal totalAmount() {
        return amount.subtract(discountAmount);
    }

    public boolean markPaid() {
        if (status != Status.PENDING) {
            return false;
        }
        status = Status.PAID;
        return true;
    }

    public Long getId() {
        return id;
    }

    public Long getRentalId() {
        return rentalId;
    }

    public Long getRenewalId() {
        return renewalId;
    }

    public Long getFeeTypeId() {
        return feeTypeId;
    }

    public Type getType() {
        return type;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public Instant getDueAt() {
        return dueAt;
    }

    public Status getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
