package com.storage.rental.entity;

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
import java.time.LocalDate;
import java.util.Objects;

@Entity
@Table(name = "rentals")
public class Rental {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "unit_id", nullable = false)
    private Long unitId;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "appointment_at")
    private Instant appointmentAt;

    @Column(name = "price_per_month", nullable = false, precision = 14, scale = 2)
    private BigDecimal pricePerMonth;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private RentalStatus status;

    @Column(name = "payment_expires_at")
    private Instant paymentExpiresAt;

    @Column(name = "checked_in_at")
    private Instant checkedInAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "access_method", length = 20)
    private AccessMethod accessMethod;

    @Column(name = "handover_condition")
    private String handoverCondition;

    @Column(name = "returned_at")
    private Instant returnedAt;

    @Column(name = "return_condition")
    private String returnCondition;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Rental() {
    }

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
        this.createdAt = Instant.now();
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

    public void setAppointmentAt(Instant appointmentAt) {
        this.appointmentAt = appointmentAt;
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

    public Long getId() {
        return id;
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

    public Instant getAppointmentAt() {
        return appointmentAt;
    }

    public BigDecimal getPricePerMonth() {
        return pricePerMonth;
    }

    public RentalStatus getStatus() {
        return status;
    }

    public Instant getPaymentExpiresAt() {
        return paymentExpiresAt;
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

    public Instant getCreatedAt() {
        return createdAt;
    }
}
