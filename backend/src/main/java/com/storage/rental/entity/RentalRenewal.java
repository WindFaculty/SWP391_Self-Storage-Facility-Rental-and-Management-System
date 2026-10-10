package com.storage.rental.entity;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;

public class RentalRenewal {

    private final Rental rental;
    private final LocalDate previousEndDate;
    private final LocalDate requestedEndDate;
    private final Instant requestedAt;
    private RenewalStatus status;
    private Instant decidedAt;

    public RentalRenewal(Rental rental, LocalDate requestedEndDate, Instant requestedAt) {
        this.rental = Objects.requireNonNull(rental, "rental");
        this.previousEndDate = rental.getEndDate();
        this.requestedEndDate = Objects.requireNonNull(requestedEndDate, "requestedEndDate");
        if (!requestedEndDate.isAfter(previousEndDate)) {
            throw new IllegalArgumentException("requestedEndDate must extend the rental: " +
                    requestedEndDate + " <= " + previousEndDate);
        }
        this.requestedAt = Objects.requireNonNull(requestedAt, "requestedAt");
        this.status = RenewalStatus.REQUESTED;
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

    public Rental getRental() {
        return rental;
    }

    public LocalDate getPreviousEndDate() {
        return previousEndDate;
    }

    public LocalDate getRequestedEndDate() {
        return requestedEndDate;
    }

    public Instant getRequestedAt() {
        return requestedAt;
    }

    public RenewalStatus getStatus() {
        return status;
    }

    public Instant getDecidedAt() {
        return decidedAt;
    }
}
