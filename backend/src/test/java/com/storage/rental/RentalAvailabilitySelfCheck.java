package com.storage.rental;

import com.storage.facility.entity.UnitStatus;
import com.storage.rental.entity.Rental;
import com.storage.rental.entity.RentalStatus;
import com.storage.rental.service.RentalAvailability;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class RentalAvailabilitySelfCheck {

    private static final Instant EXPIRES = Instant.parse("2026-10-10T00:15:00Z");
    private static final LocalDate START = LocalDate.of(2026, 10, 10);
    private static final LocalDate END = LocalDate.of(2026, 11, 10);

    private RentalAvailabilitySelfCheck() {
    }

    public static void main(String[] args) {
        check(available(UnitStatus.AVAILABLE, List.of()), "free available unit is bookable");
        check(available(UnitStatus.OCCUPIED, List.of()), "occupied unit can be prebooked");
        check(!available(UnitStatus.MAINTENANCE, List.of()), "maintenance blocks every rental");
        check(!available(UnitStatus.INSPECTION, List.of()), "inspection blocks every rental");

        for (RentalStatus blocking : List.of(RentalStatus.PENDING_PAYMENT, RentalStatus.RESERVED,
                RentalStatus.ACTIVE, RentalStatus.OVERDUE)) {
            Rental existing = rental(START, END, blocking);
            check(!RentalAvailability.isAvailable(UnitStatus.AVAILABLE, List.of(existing),
                    LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 5)),
                    blocking + " overlap blocks the unit");
        }

        for (RentalStatus released : List.of(RentalStatus.CANCELLED, RentalStatus.EXPIRED, RentalStatus.RETURNED)) {
            Rental existing = rental(START, END, released);
            check(available(UnitStatus.AVAILABLE, List.of(existing)), released + " does not block");
        }

        Rental before = rental(LocalDate.of(2026, 9, 10), START, RentalStatus.RESERVED);
        check(available(UnitStatus.AVAILABLE, List.of(before)), "adjacent range before is free");
        Rental reserved = rental(START, END, RentalStatus.RESERVED);
        check(RentalAvailability.isAvailable(UnitStatus.AVAILABLE, List.of(reserved),
                END, LocalDate.of(2026, 12, 10)), "back-to-back start on end_date is free");
        check(!RentalAvailability.isAvailable(UnitStatus.AVAILABLE, List.of(reserved),
                LocalDate.of(2026, 11, 9), LocalDate.of(2026, 11, 20)), "overlap before end_date blocks");

        expectFailure("invalid empty range rejected");
        System.out.println("RentalAvailabilitySelfCheck: all checks passed");
    }

    private static boolean available(UnitStatus status, List<Rental> rentals) {
        return RentalAvailability.isAvailable(status, rentals, START, END);
    }

    private static void check(boolean condition, String label) {
        if (!condition) {
            throw new AssertionError("FAILED: " + label);
        }
    }

    private static void expectFailure(String label) {
        try {
            RentalAvailability.isAvailable(UnitStatus.AVAILABLE, List.of(), END, START);
        } catch (IllegalArgumentException expected) {
            return;
        }
        throw new AssertionError("FAILED (no exception thrown): " + label);
    }

    private static Rental rental(LocalDate start, LocalDate end, RentalStatus status) {
        Rental rental = Rental.createHold(1L, 10L, start, end, new BigDecimal("1500000.00"), EXPIRES);
        switch (status) {
            case PENDING_PAYMENT -> {
            }
            case RESERVED -> rental.transitionTo(RentalStatus.RESERVED);
            case ACTIVE -> {
                rental.transitionTo(RentalStatus.RESERVED);
                rental.transitionTo(RentalStatus.ACTIVE);
            }
            case OVERDUE -> {
                rental.transitionTo(RentalStatus.RESERVED);
                rental.transitionTo(RentalStatus.ACTIVE);
                rental.transitionTo(RentalStatus.OVERDUE);
            }
            case RETURNED -> {
                rental.transitionTo(RentalStatus.RESERVED);
                rental.transitionTo(RentalStatus.ACTIVE);
                rental.transitionTo(RentalStatus.RETURNED);
            }
            case CANCELLED -> rental.transitionTo(RentalStatus.CANCELLED);
            case EXPIRED -> rental.transitionTo(RentalStatus.EXPIRED);
        }
        return rental;
    }
}
