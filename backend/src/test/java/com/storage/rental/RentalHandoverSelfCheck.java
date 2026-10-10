package com.storage.rental;

import com.storage.rental.entity.AccessMethod;
import com.storage.rental.entity.Rental;
import com.storage.rental.entity.RentalStatus;
import com.storage.rental.entity.StaffTask;
import com.storage.rental.entity.TaskStatus;
import com.storage.rental.entity.TaskType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public final class RentalHandoverSelfCheck {

    private static final LocalDate START = LocalDate.of(2026, 10, 10);
    private static final LocalDate END = LocalDate.of(2026, 11, 10);
    private static final Instant EXPIRES = Instant.parse("2026-10-10T00:15:00Z");
    private static final Instant CHECK_IN_AT = Instant.parse("2026-10-10T09:00:00Z");

    private RentalHandoverSelfCheck() {
    }

    public static void main(String[] args) {
        Rental unpaid = hold();
        expectFailure(() -> unpaid.checkIn(CHECK_IN_AT, AccessMethod.KEY, "ok"),
                "check-in before payment is rejected");
        check(unpaid.getStatus() == RentalStatus.PENDING_PAYMENT, "unpaid rental untouched");

        Rental expired = hold();
        expired.transitionTo(RentalStatus.EXPIRED);
        expectFailure(() -> expired.checkIn(CHECK_IN_AT, AccessMethod.KEY, null),
                "expired hold cannot check in");

        Rental rental = hold();
        rental.transitionTo(RentalStatus.RESERVED);
        rental.checkIn(CHECK_IN_AT, AccessMethod.ACCESS_CARD, "Door and card handed over");
        check(rental.getStatus() == RentalStatus.ACTIVE, "check-in activates a reserved rental");
        check(CHECK_IN_AT.equals(rental.getCheckedInAt()), "check-in time recorded");
        check(rental.getAccessMethod() == AccessMethod.ACCESS_CARD, "access method recorded");
        check("Door and card handed over".equals(rental.getHandoverCondition()), "handover condition recorded");
        expectFailure(() -> rental.checkIn(CHECK_IN_AT, AccessMethod.KEY, null), "double check-in rejected");

        Rental nullMethod = hold();
        nullMethod.transitionTo(RentalStatus.RESERVED);
        expectFailure(() -> nullMethod.checkIn(CHECK_IN_AT, null, null), "null access method rejected");
        check(nullMethod.getStatus() == RentalStatus.RESERVED, "failed check-in keeps reserved status");

        StaffTask handover = new StaffTask(7L, 10L, null, TaskType.HANDOVER, CHECK_IN_AT);
        check(handover.getStatus() == TaskStatus.ASSIGNED, "task starts assigned");
        handover.start();
        check(handover.getStatus() == TaskStatus.IN_PROGRESS, "task can start");
        handover.complete(CHECK_IN_AT.plusSeconds(3600));
        check(handover.getStatus() == TaskStatus.DONE, "task completes");
        check(CHECK_IN_AT.plusSeconds(3600).equals(handover.getCompletedAt()), "completion time recorded");
        expectFailure(handover::start, "done task cannot restart");

        StaffTask direct = new StaffTask(7L, 11L, null, TaskType.RETURN_INSPECTION, CHECK_IN_AT);
        direct.complete(CHECK_IN_AT);
        check(direct.getStatus() == TaskStatus.DONE, "task can complete without explicit start");

        StaffTask support = new StaffTask(8L, null, 5L, TaskType.SUPPORT, CHECK_IN_AT);
        support.cancel();
        check(support.getStatus() == TaskStatus.CANCELLED, "support task can cancel");
        expectFailure(() -> support.complete(CHECK_IN_AT), "cancelled task cannot complete");

        expectFailure(() -> new StaffTask(null, 10L, null, TaskType.HANDOVER, CHECK_IN_AT),
                "task requires assigned staff");
        expectFailure(() -> new StaffTask(7L, null, null, TaskType.HANDOVER, CHECK_IN_AT),
                "HANDOVER task requires rental");
        expectFailure(() -> new StaffTask(7L, 10L, 5L, TaskType.HANDOVER, CHECK_IN_AT),
                "HANDOVER task rejects ticket");
        expectFailure(() -> new StaffTask(7L, 10L, null, TaskType.SUPPORT, CHECK_IN_AT),
                "SUPPORT task requires ticket");

        System.out.println("RentalHandoverSelfCheck: all checks passed");
    }

    private static Rental hold() {
        return Rental.createHold(1L, 10L, START, END, new BigDecimal("1500000.00"), EXPIRES);
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
