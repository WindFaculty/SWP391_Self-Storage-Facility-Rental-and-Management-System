package com.storage.rental;

import com.storage.facility.entity.StorageUnitStatus;
import com.storage.rental.entity.Rental;
import com.storage.rental.entity.RentalStatus;
import com.storage.rental.service.RentalHoldService;
import com.storage.rental.service.RentalHoldService.LatePaymentOutcome;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public final class RentalHoldTimeoutSelfCheck {

    private static final LocalDate START = LocalDate.of(2026, 10, 10);
    private static final LocalDate END = LocalDate.of(2026, 11, 10);
    private static final BigDecimal PRICE = new BigDecimal("1500000.00");
    private static final Instant EXPIRES = Instant.parse("2026-10-10T00:15:00Z");

    private RentalHoldTimeoutSelfCheck() {
    }

    public static void main(String[] args) {
        RentalHoldService service = new RentalHoldService();
        Rental hold = service.createHold(10L, StorageUnitStatus.AVAILABLE, 1L, START, END, PRICE, EXPIRES);
        check(service.expireHolds(EXPIRES.minusSeconds(1)) == 0, "hold before expiry is kept");
        check(hold.getStatus() == RentalStatus.PENDING_PAYMENT, "unexpired hold stays pending");
        check(service.expireHolds(EXPIRES) == 1, "hold expiring exactly at now is swept");
        check(hold.getStatus() == RentalStatus.EXPIRED, "swept hold becomes EXPIRED");

        Rental reuse = service.createHold(10L, StorageUnitStatus.AVAILABLE, 2L, START, END, PRICE, EXPIRES.plusSeconds(3600));
        check(reuse.getStatus() == RentalStatus.PENDING_PAYMENT, "expired hold does not block the schedule");
        check(service.resolveLatePayment(hold, StorageUnitStatus.AVAILABLE, EXPIRES.plusSeconds(60))
                == LatePaymentOutcome.NEEDS_RECONCILIATION, "late payment cannot steal a taken slot");
        check(hold.getStatus() == RentalStatus.EXPIRED, "conflicting late payment stays expired");

        RentalHoldService free = new RentalHoldService();
        Rental late = free.createHold(20L, StorageUnitStatus.AVAILABLE, 3L, START, END, PRICE, EXPIRES);
        free.expireHolds(EXPIRES);
        check(free.resolveLatePayment(late, StorageUnitStatus.AVAILABLE, EXPIRES.plusSeconds(60))
                == LatePaymentOutcome.REACTIVATED, "late payment revives a free expired hold");
        check(late.getStatus() == RentalStatus.RESERVED, "revived hold is reserved");

        RentalHoldService maint = new RentalHoldService();
        Rental maintenance = maint.createHold(40L, StorageUnitStatus.AVAILABLE, 1L, START, END, PRICE, EXPIRES);
        maint.expireHolds(EXPIRES);
        check(maint.resolveLatePayment(maintenance, StorageUnitStatus.MAINTENANCE, EXPIRES.plusSeconds(60))
                == LatePaymentOutcome.NEEDS_RECONCILIATION, "maintenance unit blocks revival");
        check(maintenance.getStatus() == RentalStatus.EXPIRED, "blocked revival stays expired");

        RentalHoldService current = new RentalHoldService();
        Rental live = current.createHold(30L, StorageUnitStatus.AVAILABLE, 1L, START, END, PRICE, EXPIRES);
        expectFailure(() -> current.resolveLatePayment(live, StorageUnitStatus.AVAILABLE, EXPIRES.minusSeconds(1)),
                "payment on a live hold is not late");
        check(live.getStatus() == RentalStatus.PENDING_PAYMENT, "live hold untouched");

        Rental reserved = current.createHold(31L, StorageUnitStatus.AVAILABLE, 1L, START, END, PRICE, EXPIRES);
        reserved.transitionTo(RentalStatus.RESERVED);
        expectFailure(() -> current.resolveLatePayment(reserved, StorageUnitStatus.AVAILABLE, EXPIRES.plusSeconds(60)),
                "reserved rental is not a late hold");
        check(reserved.getStatus() == RentalStatus.RESERVED, "reserved rental untouched");

        Rental stranger = Rental.createHold(1L, 99L, START, END, PRICE, EXPIRES);
        stranger.transitionTo(RentalStatus.EXPIRED);
        expectFailure(() -> current.resolveLatePayment(stranger, StorageUnitStatus.AVAILABLE, EXPIRES.plusSeconds(60)),
                "unknown rental is rejected");

        RentalHoldService cancelling = new RentalHoldService();
        Rental pending = cancelling.createHold(50L, StorageUnitStatus.AVAILABLE, 1L, START, END, PRICE, EXPIRES);
        cancelling.cancel(pending);
        check(pending.getStatus() == RentalStatus.CANCELLED, "pending hold is cancelled");
        expectFailure(() -> cancelling.cancel(pending), "double cancel is rejected");

        Rental reservedToCancel = cancelling.createHold(51L, StorageUnitStatus.AVAILABLE, 1L, START, END, PRICE, EXPIRES);
        reservedToCancel.transitionTo(RentalStatus.RESERVED);
        cancelling.cancel(reservedToCancel);
        check(reservedToCancel.getStatus() == RentalStatus.CANCELLED, "reserved booking is cancelled");

        Rental active = cancelling.createHold(52L, StorageUnitStatus.AVAILABLE, 1L, START, END, PRICE, EXPIRES);
        active.transitionTo(RentalStatus.RESERVED);
        active.transitionTo(RentalStatus.ACTIVE);
        expectFailure(() -> cancelling.cancel(active), "active rental cannot be cancelled");
        check(active.getStatus() == RentalStatus.ACTIVE, "active rental untouched");

        Rental reservedKeep = cancelling.createHold(53L, StorageUnitStatus.AVAILABLE, 1L, START, END, PRICE, EXPIRES);
        reservedKeep.transitionTo(RentalStatus.RESERVED);
        check(cancelling.expireHolds(EXPIRES.plusSeconds(9999)) == 0, "non-pending holds are not swept");
        check(reservedKeep.getStatus() == RentalStatus.RESERVED, "reserved hold keeps its status");

        System.out.println("RentalHoldTimeoutSelfCheck: all checks passed");
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
