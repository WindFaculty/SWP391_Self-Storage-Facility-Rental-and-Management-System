package com.storage.rental;

import com.storage.facility.entity.StorageUnitStatus;
import com.storage.rental.entity.Rental;
import com.storage.rental.entity.RentalStatus;
import com.storage.rental.entity.RenewalStatus;
import com.storage.rental.entity.StaffTask;
import com.storage.rental.entity.TaskStatus;
import com.storage.rental.entity.TaskType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.Set;

public final class RentalStateMachineSelfCheck {

    private static final Map<RentalStatus, Set<RentalStatus>> EXPECTED_RENTAL_TRANSITIONS = Map.of(
            RentalStatus.PENDING_PAYMENT, Set.of(RentalStatus.RESERVED, RentalStatus.CANCELLED, RentalStatus.EXPIRED),
            RentalStatus.RESERVED, Set.of(RentalStatus.ACTIVE, RentalStatus.CANCELLED),
            RentalStatus.ACTIVE, Set.of(RentalStatus.OVERDUE, RentalStatus.RETURNED, RentalStatus.RETURN_REQUESTED),
            RentalStatus.OVERDUE, Set.of(RentalStatus.RETURNED, RentalStatus.RETURN_REQUESTED),
            RentalStatus.RETURN_REQUESTED, Set.of(RentalStatus.RETURNED, RentalStatus.ACTIVE),
            RentalStatus.EXPIRED, Set.of(RentalStatus.RESERVED),
            RentalStatus.RETURNED, Set.of(),
            RentalStatus.CANCELLED, Set.of());

    private static final Map<TaskStatus, Set<TaskStatus>> EXPECTED_TASK_TRANSITIONS = Map.of(
            TaskStatus.ASSIGNED, Set.of(TaskStatus.IN_PROGRESS, TaskStatus.DONE, TaskStatus.CANCELLED),
            TaskStatus.IN_PROGRESS, Set.of(TaskStatus.DONE, TaskStatus.CANCELLED),
            TaskStatus.DONE, Set.of(),
            TaskStatus.CANCELLED, Set.of());

    private static final Map<RenewalStatus, Set<RenewalStatus>> EXPECTED_RENEWAL_TRANSITIONS = Map.of(
            RenewalStatus.REQUESTED, Set.of(RenewalStatus.APPROVED, RenewalStatus.REJECTED, RenewalStatus.APPLIED),
            RenewalStatus.APPROVED, Set.of(RenewalStatus.APPLIED, RenewalStatus.REJECTED),
            RenewalStatus.REJECTED, Set.of(),
            RenewalStatus.APPLIED, Set.of());

    private static final LocalDate START = LocalDate.of(2026, 10, 10);
    private static final LocalDate END = LocalDate.of(2026, 11, 10);
    private static final BigDecimal PRICE = new BigDecimal("1500000.00");
    private static final Instant EXPIRES = Instant.parse("2026-10-10T00:15:00Z");

    private RentalStateMachineSelfCheck() {
    }

    public static void main(String[] args) {
        rentalTransitionMatrix();
        rentalTransitionEnforcement();
        availabilityBlockingMatrix();
        taskTransitionMatrix();
        renewalTransitionMatrix();
        unitStatusGuards();
        System.out.println("RentalStateMachineSelfCheck: all checks passed");
    }

    private static void rentalTransitionMatrix() {
        for (RentalStatus from : RentalStatus.values()) {
            for (RentalStatus to : RentalStatus.values()) {
                check(from.canTransitionTo(to) == EXPECTED_RENTAL_TRANSITIONS.get(from).contains(to),
                        from + " -> " + to + " allowed flag");
            }
            check(from.isTerminal() == EXPECTED_RENTAL_TRANSITIONS.get(from).isEmpty(),
                    from + " terminal flag");
        }
    }

    private static void rentalTransitionEnforcement() {
        for (RentalStatus from : RentalStatus.values()) {
            for (RentalStatus to : RentalStatus.values()) {
                Rental rental = rentalIn(from);
                boolean allowed = EXPECTED_RENTAL_TRANSITIONS.get(from).contains(to);
                try {
                    rental.transitionTo(to);
                    check(allowed, "transitionTo accepted " + from + " -> " + to);
                } catch (IllegalStateException e) {
                    check(!allowed, "transitionTo rejected " + from + " -> " + to);
                    check(rental.getStatus() == from, "failed transition keeps status " + from);
                }
            }
        }
    }

    private static void availabilityBlockingMatrix() {
        Set<RentalStatus> blocking = Set.of(RentalStatus.PENDING_PAYMENT, RentalStatus.RESERVED,
                RentalStatus.ACTIVE, RentalStatus.OVERDUE, RentalStatus.RETURN_REQUESTED);
        for (RentalStatus status : RentalStatus.values()) {
            check(status.blocksAvailability() == blocking.contains(status), status + " blocking flag");
        }
    }

    private static void taskTransitionMatrix() {
        for (TaskStatus from : TaskStatus.values()) {
            for (TaskStatus to : TaskStatus.values()) {
                check(from.canTransitionTo(to) == EXPECTED_TASK_TRANSITIONS.get(from).contains(to),
                        "task " + from + " -> " + to + " allowed flag");
            }
            check(from.isTerminal() == EXPECTED_TASK_TRANSITIONS.get(from).isEmpty(),
                    "task " + from + " terminal flag");
        }

        StaffTask task = new StaffTask(7L, 10L, null, TaskType.HANDOVER, EXPIRES);
        task.complete(EXPIRES);
        expectFailure(task::start, "done task cannot start");
        expectFailure(() -> task.complete(EXPIRES), "done task cannot complete twice");
        expectFailure(task::cancel, "done task cannot cancel");
    }

    private static void renewalTransitionMatrix() {
        for (RenewalStatus from : RenewalStatus.values()) {
            for (RenewalStatus to : RenewalStatus.values()) {
                check(from.canTransitionTo(to) == EXPECTED_RENEWAL_TRANSITIONS.get(from).contains(to),
                        "renewal " + from + " -> " + to + " allowed flag");
            }
            check(from.isTerminal() == EXPECTED_RENEWAL_TRANSITIONS.get(from).isEmpty(),
                    "renewal " + from + " terminal flag");
        }
    }

    private static void unitStatusGuards() {
        for (StorageUnitStatus status : StorageUnitStatus.values()) {
            try {
                status.onReturned();
                check(status == StorageUnitStatus.OCCUPIED, "onReturned accepted for " + status);
            } catch (IllegalStateException e) {
                check(status != StorageUnitStatus.OCCUPIED, "onReturned rejected for " + status);
            }
            try {
                status.onInspection(true);
                check(status == StorageUnitStatus.INSPECTION, "onInspection accepted for " + status);
            } catch (IllegalStateException e) {
                check(status != StorageUnitStatus.INSPECTION, "onInspection rejected for " + status);
            }
        }
        check(StorageUnitStatus.INSPECTION.blocksNewRental() && StorageUnitStatus.MAINTENANCE.blocksNewRental(),
                "unready unit statuses block new rentals");
        check(!StorageUnitStatus.AVAILABLE.blocksNewRental() && !StorageUnitStatus.OCCUPIED.blocksNewRental(),
                "ready unit statuses allow new rentals");
    }

    private static Rental rentalIn(RentalStatus status) {
        Rental rental = Rental.createHold(1L, 10L, START, END, PRICE, EXPIRES);
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
            case RETURN_REQUESTED -> {
                rental.transitionTo(RentalStatus.RESERVED);
                rental.transitionTo(RentalStatus.ACTIVE);
                rental.transitionTo(RentalStatus.RETURN_REQUESTED);
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

    private static void check(boolean condition, String label) {
        if (!condition) {
            throw new AssertionError("FAILED: " + label);
        }
    }

    private static void expectFailure(Runnable action, String label) {
        try {
            action.run();
        } catch (IllegalStateException | IllegalArgumentException expected) {
            return;
        }
        throw new AssertionError("FAILED (no exception thrown): " + label);
    }
}
