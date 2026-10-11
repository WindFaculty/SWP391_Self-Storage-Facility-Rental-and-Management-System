package com.storage.rental.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;

@Entity
@Table(name = "rental_renewals")
public class RentalRenewal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rental_id", nullable = false)
    private Long rentalId;

    @Column(name = "previous_end_date", nullable = false)
    private LocalDate previousEndDate;

    @Column(name = "requested_end_date", nullable = false)
    private LocalDate requestedEndDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 12)
    private RenewalStatus status;

    @Column(name = "approved_by_user_id")
    private Long approvedByUserId;

    @Column(name = "requested_at", nullable = false, updatable = false)
    private Instant requestedAt;

    @Column(name = "decided_at")
    private Instant decidedAt;

    protected RentalRenewal() {
    }

    public static RentalRenewal request(Rental rental, LocalDate requestedEndDate, Instant requestedAt) {
        Objects.requireNonNull(rental, "rental");
        LocalDate previousEndDate = rental.getEndDate();
        Objects.requireNonNull(requestedEndDate, "requestedEndDate");
        if (!requestedEndDate.isAfter(previousEndDate)) {
            throw new IllegalArgumentException("requestedEndDate must extend the rental: " +
                    requestedEndDate + " <= " + previousEndDate);
        }
        RentalRenewal renewal = new RentalRenewal();
        renewal.rentalId = rental.getId();
        renewal.previousEndDate = previousEndDate;
        renewal.requestedEndDate = requestedEndDate;
        renewal.requestedAt = Objects.requireNonNull(requestedAt, "requestedAt");
        renewal.status = RenewalStatus.REQUESTED;
        return renewal;
    }

    public void apply(Instant at) {
        Objects.requireNonNull(at, "at");
        transitionTo(RenewalStatus.APPLIED);
        this.decidedAt = at;
    }

    public void reject(Instant at) {
        Objects.requireNonNull(at, "at");
        transitionTo(RenewalStatus.REJECTED);
        this.decidedAt = at;
    }

    private void transitionTo(RenewalStatus next) {
        if (!status.canTransitionTo(next)) {
            throw new IllegalStateException("Illegal renewal transition: " + status + " -> " + next);
        }
        status = next;
    }

    public Long getId() {
        return id;
    }

    public Long getRentalId() {
        return rentalId;
    }

    public LocalDate getPreviousEndDate() {
        return previousEndDate;
    }

    public LocalDate getRequestedEndDate() {
        return requestedEndDate;
    }

    public RenewalStatus getStatus() {
        return status;
    }

    public Long getApprovedByUserId() {
        return approvedByUserId;
    }

    public Instant getRequestedAt() {
        return requestedAt;
    }

    public Instant getDecidedAt() {
        return decidedAt;
    }
}
