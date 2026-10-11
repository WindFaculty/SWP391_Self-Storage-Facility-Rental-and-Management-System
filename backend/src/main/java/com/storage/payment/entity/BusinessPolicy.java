package com.storage.payment.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "business_policies")
public class BusinessPolicy {

    /** Single-row policy table; this is its only key. */
    public static final short ID = 1;

    @Id
    @Column(name = "id")
    private Short id;

    @Column(name = "deposit_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal depositPercent;

    @Column(name = "renewal_notice_days", nullable = false)
    private Integer renewalNoticeDays;

    @Column(name = "cancellation_fee", nullable = false, precision = 14, scale = 2)
    private BigDecimal cancellationFee;

    @Column(name = "return_notice_days", nullable = false)
    private Integer returnNoticeDays;

    @Column(name = "overdue_grace_days", nullable = false)
    private Integer overdueGraceDays;

    @Column(name = "overdue_fee_per_day", nullable = false, precision = 14, scale = 2)
    private BigDecimal overdueFeePerDay;

    @Column(name = "max_discount_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal maxDiscountPercent;

    @Column(name = "updated_by_user_id")
    private Long updatedByUserId;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected BusinessPolicy() {
    }

    public static BusinessPolicy initial() {
        BusinessPolicy policy = new BusinessPolicy();
        policy.id = 1;
        return policy;
    }

    public void update(BigDecimal depositPercent, Integer renewalNoticeDays,
                       BigDecimal cancellationFee, Integer returnNoticeDays,
                       Integer overdueGraceDays, BigDecimal overdueFeePerDay,
                       BigDecimal maxDiscountPercent, Long updatedByUserId) {
        requirePercent("depositPercent", depositPercent);
        requirePercent("maxDiscountPercent", maxDiscountPercent);
        requireNonNegative("cancellationFee", cancellationFee);
        requireNonNegative("overdueFeePerDay", overdueFeePerDay);
        requireDays("renewalNoticeDays", renewalNoticeDays);
        requireDays("returnNoticeDays", returnNoticeDays);
        requireDays("overdueGraceDays", overdueGraceDays);
        this.depositPercent = depositPercent;
        this.renewalNoticeDays = renewalNoticeDays;
        this.cancellationFee = cancellationFee;
        this.returnNoticeDays = returnNoticeDays;
        this.overdueGraceDays = overdueGraceDays;
        this.overdueFeePerDay = overdueFeePerDay;
        this.maxDiscountPercent = maxDiscountPercent;
        this.updatedByUserId = updatedByUserId;
        this.updatedAt = Instant.now();
    }

    private static void requirePercent(String field, BigDecimal value) {
        if (value == null || value.signum() < 0
                || value.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new IllegalArgumentException(field + " must be between 0 and 100");
        }
    }

    private static void requireNonNegative(String field, BigDecimal value) {
        if (value == null || value.signum() < 0) {
            throw new IllegalArgumentException(field + " must be >= 0");
        }
    }

    private static void requireDays(String field, Integer value) {
        if (value == null || value < 0) {
            throw new IllegalArgumentException(field + " must be >= 0");
        }
    }

    public Short getId() {
        return id;
    }

    public BigDecimal getDepositPercent() {
        return depositPercent;
    }

    public Integer getRenewalNoticeDays() {
        return renewalNoticeDays;
    }

    public BigDecimal getCancellationFee() {
        return cancellationFee;
    }

    public Integer getReturnNoticeDays() {
        return returnNoticeDays;
    }

    public Integer getOverdueGraceDays() {
        return overdueGraceDays;
    }

    public BigDecimal getOverdueFeePerDay() {
        return overdueFeePerDay;
    }

    public BigDecimal getMaxDiscountPercent() {
        return maxDiscountPercent;
    }

    public Long getUpdatedByUserId() {
        return updatedByUserId;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
