package com.storage.rental;

import com.storage.rental.entity.Rental;
import com.storage.rental.entity.RentalStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public final class RentalSelfCheck {

    private RentalSelfCheck() {
    }

    public static void main(String[] args) {
        Rental rental = hold(LocalDate.of(2026, 10, 10), LocalDate.of(2026, 11, 10));
        check(rental.getStatus() == RentalStatus.PENDING_PAYMENT, "starts as PENDING_PAYMENT");
        check(rental.getPricePerMonth().equals(new BigDecimal("1500000.00")), "price snapshot is kept");

        rental.transitionTo(RentalStatus.RESERVED);
        rental.transitionTo(RentalStatus.ACTIVE);
        rental.transitionTo(RentalStatus.OVERDUE);
        rental.transitionTo(RentalStatus.RETURNED);
        check(rental.getStatus().isTerminal(), "RETURNED is terminal");
        expectFailure(() -> rental.transitionTo(RentalStatus.ACTIVE), "no transition out of RETURNED");

        Rental expiredHold = hold(LocalDate.of(2026, 10, 10), LocalDate.of(2026, 11, 10));
        expiredHold.transitionTo(RentalStatus.EXPIRED);
        expectFailure(() -> expiredHold.transitionTo(RentalStatus.RESERVED), "expired hold stays expired");

        Rental cancelledHold = hold(LocalDate.of(2026, 10, 10), LocalDate.of(2026, 11, 10));
        cancelledHold.transitionTo(RentalStatus.CANCELLED);
        expectFailure(() -> cancelledHold.transitionTo(RentalStatus.RESERVED), "cancelled hold stays cancelled");

        Rental unpaid = hold(LocalDate.of(2026, 10, 10), LocalDate.of(2026, 11, 10));
        expectFailure(() -> unpaid.transitionTo(RentalStatus.ACTIVE), "cannot activate unpaid hold");
        expectFailure(() -> unpaid.transitionTo(null), "null target rejected");
        expectFailure(() -> Rental.createHold(1L, 10L, LocalDate.of(2026, 10, 10), LocalDate.of(2026, 10, 10),
                new BigDecimal("1500000.00"), Instant.parse("2026-10-10T00:15:00Z")),
                "empty interval rejected");

        Rental base = hold(LocalDate.of(2026, 10, 10), LocalDate.of(2026, 11, 10));
        check(base.overlaps(LocalDate.of(2026, 11, 9), LocalDate.of(2026, 11, 20)), "overlap before own end");
        check(base.overlaps(LocalDate.of(2026, 9, 1), LocalDate.of(2026, 10, 11)), "overlap after own start");
        check(!base.overlaps(LocalDate.of(2026, 11, 10), LocalDate.of(2026, 12, 10)), "end_date is exclusive");
        check(!base.overlaps(LocalDate.of(2026, 9, 1), LocalDate.of(2026, 10, 10)), "adjacent before is free");
        check(base.overlaps(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 20)), "contained range overlaps");

        System.out.println("RentalSelfCheck: all checks passed");
    }

    private static Rental hold(LocalDate start, LocalDate end) {
        return Rental.createHold(1L, 10L, start, end, new BigDecimal("1500000.00"),
                Instant.parse("2026-10-10T00:15:00Z"));
    }

    private static void check(boolean condition, String label) {
        if (!condition) {
            throw new AssertionError("FAILED: " + label);
        }
    }

    private static void expectFailure(Runnable action, String label) {
        try {
            action.run();
        } catch (IllegalStateException | IllegalArgumentException | NullPointerException expected) {
            return;
        }
        throw new AssertionError("FAILED (no exception thrown): " + label);
    }
}
