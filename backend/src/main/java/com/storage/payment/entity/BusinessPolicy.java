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
