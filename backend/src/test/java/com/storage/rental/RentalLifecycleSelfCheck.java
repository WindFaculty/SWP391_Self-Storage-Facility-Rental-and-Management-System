package com.storage.rental;

import com.storage.facility.entity.UnitStatus;
import com.storage.rental.entity.AccessMethod;
import com.storage.rental.entity.Rental;
import com.storage.rental.entity.RentalRenewal;
import com.storage.rental.entity.RentalStatus;
import com.storage.rental.entity.RenewalStatus;
import com.storage.rental.service.RentalHoldService;
import com.storage.rental.service.UnitNotAvailableException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public final class RentalLifecycleSelfCheck {

    private static final LocalDate START = LocalDate.of(2026, 10, 10);
    private static final LocalDate END = LocalDate.of(2026, 11, 10);
    private static final LocalDate EXTENDED_END = LocalDate.of(2026, 12, 10);
    private static final BigDecimal PRICE = new BigDecimal("1500000.00");
    private static final Instant EXPIRES = Instant.parse("2026-10-10T00:15:00Z");
    private static final Instant CHECK_IN_AT = Instant.parse("2026-10-10T09:00:00Z");
    private static final Instant DECIDED_AT = Instant.parse("2026-11-01T10:00:00Z");
    private static final Instant RETURN_AT = Instant.parse("2026-11-10T10:00:00Z");

    private RentalLifecycleSelfCheck() {
    }

    public static void main(String[] args) {
        renewalFlow();
        requestConflictFlow();
        lateConflictFlow();
        rejectFlow();
        overdueFlow();
        checkoutFlow();
        inspectionFlow();
        System.out.println("RentalLifecycleSelfCheck: all checks passed");
    }

    private static void renewalFlow() {
        RentalHoldService service = new RentalHoldService();
        Rental rental = active(service, 10L);

        RentalRenewal renewal = service.requestRenewal(rental, UnitStatus.AVAILABLE, EXTENDED_END, DECIDED_AT);
        check(renewal.getStatus() == RenewalStatus.REQUESTED, "renewal starts requested");
        check(END.equals(renewal.getPreviousEndDate()), "previous end date snapshot");
        check(EXTENDED_END.equals(renewal.getRequestedEndDate()), "requested end date kept");
        check(END.equals(rental.getEndDate()), "request does not move the rental end");

        service.applyRenewal(renewal, UnitStatus.AVAILABLE, DECIDED_AT.plusSeconds(1));
        check(EXTENDED_END.equals(rental.getEndDate()), "apply moves the rental end");
        check(renewal.getStatus() == RenewalStatus.APPLIED, "renewal applied");
        check(DECIDED_AT.plusSeconds(1).equals(renewal.getDecidedAt()), "decision time recorded");
        expectFailure(() -> service.applyRenewal(renewal, UnitStatus.AVAILABLE, DECIDED_AT), "double apply rejected");

        expectFailure(() -> service.requestRenewal(rental, UnitStatus.AVAILABLE, EXTENDED_END, DECIDED_AT),
                "renewal must extend the current end");

        Rental hold = service.createHold(11L, UnitStatus.AVAILABLE, 1L, START, END, PRICE, EXPIRES);
        expectFailure(() -> service.requestRenewal(hold, UnitStatus.AVAILABLE, EXTENDED_END, DECIDED_AT),
                "renewal requires an active rental");
    }

    private static void requestConflictFlow() {
        RentalHoldService service = new RentalHoldService();
        Rental rental = active(service, 20L);
        service.createHold(20L, UnitStatus.AVAILABLE, 2L, END, EXTENDED_END, PRICE, EXPIRES.plusSeconds(86400));
        expectConflict(() -> service.requestRenewal(rental, UnitStatus.AVAILABLE, EXTENDED_END, DECIDED_AT),
                "renewal conflicting with a hold is rejected");
    }

    private static void lateConflictFlow() {
        RentalHoldService service = new RentalHoldService();
        Rental rental = active(service, 30L);
        RentalRenewal renewal = service.requestRenewal(rental, UnitStatus.AVAILABLE, EXTENDED_END, DECIDED_AT);
        service.createHold(30L, UnitStatus.AVAILABLE, 3L, END, EXTENDED_END, PRICE, EXPIRES.plusSeconds(86400));
        expectConflict(() -> service.applyRenewal(renewal, UnitStatus.AVAILABLE, DECIDED_AT.plusSeconds(1)),
                "apply re-checks the extension window");
        check(renewal.getStatus() == RenewalStatus.REQUESTED, "conflicted renewal stays requested");
        check(END.equals(rental.getEndDate()), "conflicted renewal does not move the end");
    }

    private static void rejectFlow() {
        RentalHoldService service = new RentalHoldService();
        Rental rental = active(service, 40L);
        RentalRenewal renewal = service.requestRenewal(rental, UnitStatus.AVAILABLE, EXTENDED_END, DECIDED_AT);
        renewal.reject(DECIDED_AT.plusSeconds(1));
        check(renewal.getStatus() == RenewalStatus.REJECTED, "renewal can be rejected");
        check(DECIDED_AT.plusSeconds(1).equals(renewal.getDecidedAt()), "rejection time recorded");
        expectFailure(() -> service.applyRenewal(renewal, UnitStatus.AVAILABLE, DECIDED_AT),
                "rejected renewal cannot apply");
        expectFailure(() -> renewal.reject(DECIDED_AT), "double reject rejected");
    }

    private static void overdueFlow() {
        RentalHoldService service = new RentalHoldService();
        Rental rental = active(service, 50L);
        check(service.markOverdue(END.minusDays(1)) == 0, "active before end is not overdue");
        check(rental.getStatus() == RentalStatus.ACTIVE, "rental still active before end");
        check(service.markOverdue(END) == 1, "active at end date becomes overdue");
        check(rental.getStatus() == RentalStatus.OVERDUE, "rental becomes overdue");
        check(service.markOverdue(END.plusDays(7)) == 0, "overdue rental is not swept twice");
    }

    private static void checkoutFlow() {
        RentalHoldService service = new RentalHoldService();
        Rental rental = active(service, 60L);
        rental.checkOut(RETURN_AT, "Door scratched");
        check(rental.getStatus() == RentalStatus.RETURNED, "check-out returns the rental");
        check(RETURN_AT.equals(rental.getReturnedAt()), "return time recorded");
        check("Door scratched".equals(rental.getReturnCondition()), "return condition recorded");
        expectFailure(() -> rental.checkOut(RETURN_AT, null), "double check-out rejected");

        Rental overdue = active(service, 61L);
        service.markOverdue(END);
        overdue.checkOut(Instant.parse("2026-11-12T10:00:00Z"), "Late return");
        check(overdue.getStatus() == RentalStatus.RETURNED, "overdue rental can check out");

        Rental reserved = service.createHold(62L, UnitStatus.AVAILABLE, 1L, START, END, PRICE, EXPIRES);
        reserved.transitionTo(RentalStatus.RESERVED);
        expectFailure(() -> reserved.checkOut(RETURN_AT, null), "reserved rental cannot check out");

        Rental early = active(service, 63L);
        expectFailure(() -> early.checkOut(CHECK_IN_AT.minusSeconds(1), null), "return before check-in rejected");
    }

    private static void inspectionFlow() {
        check(UnitStatus.OCCUPIED.onReturned() == UnitStatus.INSPECTION, "return sends the unit to inspection");
        check(UnitStatus.INSPECTION.onInspection(true) == UnitStatus.AVAILABLE, "passed inspection frees the unit");
        check(UnitStatus.INSPECTION.onInspection(false) == UnitStatus.MAINTENANCE,
                "failed inspection sends to maintenance");
        expectFailure(() -> UnitStatus.AVAILABLE.onReturned(), "return requires an occupied unit");
        expectFailure(() -> UnitStatus.AVAILABLE.onInspection(true), "inspection requires INSPECTION status");
    }

    private static Rental active(RentalHoldService service, long unitId) {
        Rental rental = service.createHold(unitId, UnitStatus.AVAILABLE, 1L, START, END, PRICE, EXPIRES);
        rental.transitionTo(RentalStatus.RESERVED);
        rental.checkIn(CHECK_IN_AT, AccessMethod.KEY, "Unit ready");
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

    private static void expectConflict(Runnable action, String label) {
        try {
            action.run();
        } catch (UnitNotAvailableException expected) {
            return;
        }
        throw new AssertionError("FAILED (no conflict): " + label);
    }
}
