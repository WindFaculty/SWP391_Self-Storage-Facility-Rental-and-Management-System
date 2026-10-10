package com.storage.rental.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;

public class Rental {

    private final Long customerId;
    private final Long unitId;
    private final LocalDate startDate;
    private LocalDate endDate;
    private final BigDecimal pricePerMonth;
    private final Instant paymentExpiresAt;
    private RentalStatus status;
    private Instant checkedInAt;
    private AccessMethod accessMethod;
    private String handoverCondition;
    private Instant returnedAt;
    private String returnCondition;

    private Rental(Long customerId, Long unitId, LocalDate startDate, LocalDate endDate,
                   BigDecimal pricePerMonth, Instant paymentExpiresAt) {
        this.customerId = Objects.requireNonNull(customerId, "customerId");
        this.unitId = Objects.requireNonNull(unitId, "unitId");
        this.startDate = Objects.requireNonNull(startDate, "startDate");
        this.endDate = Objects.requireNonNull(endDate, "endDate");
        if (!endDate.isAfter(startDate)) {
            throw new IllegalArgumentException("endDate must be after startDate: actual=[" +
                    startDate + ", " + endDate + ")");
        }
        this.pricePerMonth = Objects.requireNonNull(pricePerMonth, "pricePerMonth");
        if (pricePerMonth.signum() < 0) {
            throw new IllegalArgumentException("pricePerMonth must be >= 0: " + pricePerMonth);
        }
        this.paymentExpiresAt = Objects.requireNonNull(paymentExpiresAt, "paymentExpiresAt");
        this.status = RentalStatus.PENDING_PAYMENT;
    }

    public static Rental createHold(Long customerId, Long unitId, LocalDate startDate, LocalDate endDate,
                                    BigDecimal pricePerMonth, Instant paymentExpiresAt) {
        return new Rental(customerId, unitId, startDate, endDate, pricePerMonth, paymentExpiresAt);
    }

    public void transitionTo(RentalStatus next) {
        Objects.requireNonNull(next, "next");
        if (!status.canTransitionTo(next)) {
            throw new IllegalStateException("Illegal rental transition: " + status + " -> " + next);
        }
        status = next;
    }

    public boolean overlaps(LocalDate otherStart, LocalDate otherEnd) {
        return startDate.isBefore(otherEnd) && otherStart.isBefore(endDate);
    }

    public void checkIn(Instant at, AccessMethod accessMethod, String handoverCondition) {
        Objects.requireNonNull(at, "at");
        Objects.requireNonNull(accessMethod, "accessMethod");
        transitionTo(RentalStatus.ACTIVE);
        this.checkedInAt = at;
        this.accessMethod = accessMethod;
        this.handoverCondition = handoverCondition;
    }

    public void extendTo(LocalDate newEndDate) {
        Objects.requireNonNull(newEndDate, "newEndDate");
        if (!newEndDate.isAfter(endDate)) {
            throw new IllegalArgumentException("newEndDate must be after current endDate: " +
                    newEndDate + " <= " + endDate);
        }
        this.endDate = newEndDate;
    }

    public void checkOut(Instant at, String returnCondition) {
        Objects.requireNonNull(at, "at");
        if (checkedInAt != null && at.isBefore(checkedInAt)) {
            throw new IllegalArgumentException("returnedAt must not precede checkedInAt: " +
                    at + " < " + checkedInAt);
        }
        transitionTo(RentalStatus.RETURNED);
        this.returnedAt = at;
        this.returnCondition = returnCondition;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public Long getUnitId() {
        return unitId;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public BigDecimal getPricePerMonth() {
        return pricePerMonth;
    }

    public Instant getPaymentExpiresAt() {
        return paymentExpiresAt;
    }

    public RentalStatus getStatus() {
        return status;
    }

    public Instant getCheckedInAt() {
        return checkedInAt;
    }

    public AccessMethod getAccessMethod() {
        return accessMethod;
    }

    public String getHandoverCondition() {
        return handoverCondition;
    }

    public Instant getReturnedAt() {
        return returnedAt;
    }

    public String getReturnCondition() {
        return returnCondition;
    }
}
