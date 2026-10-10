package com.storage.rental;

import com.storage.facility.entity.UnitStatus;
import com.storage.rental.entity.AccessMethod;
import com.storage.rental.entity.Rental;
import com.storage.rental.entity.RentalRenewal;
import com.storage.rental.entity.RentalStatus;
import com.storage.rental.service.RentalHoldService;
import com.storage.rental.service.RentalHoldService.LatePaymentOutcome;
import com.storage.rental.service.UnitNotAvailableException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

public final class RentalRaceSelfCheck {

    private static final LocalDate START = LocalDate.of(2026, 10, 10);
    private static final LocalDate END = LocalDate.of(2026, 11, 10);
    private static final LocalDate EXTENDED_END = LocalDate.of(2026, 12, 10);
    private static final BigDecimal PRICE = new BigDecimal("1500000.00");
    private static final Instant EXPIRES = Instant.parse("2026-10-10T00:15:00Z");
    private static final Instant CHECK_IN_AT = Instant.parse("2026-10-10T09:00:00Z");
    private static final Instant DECIDED_AT = Instant.parse("2026-11-01T10:00:00Z");

    private RentalRaceSelfCheck() {
    }

    public static void main(String[] args) throws InterruptedException {
        sameWindowRace();
        adjacentWindowsRace();
        parallelUnitsRace();
        renewVsHoldRace();
        expireVsHoldRace();
        cancelVsExpireRace();
        reviveVsHoldRace();
        System.out.println("RentalRaceSelfCheck: all checks passed");
    }

    private static void sameWindowRace() throws InterruptedException {
        for (int round = 0; round < 20; round++) {
            RentalHoldService service = new RentalHoldService();
            List<Callable<?>> tasks = new ArrayList<>();
            for (int thread = 0; thread < 4; thread++) {
                long customerId = thread + 1;
                tasks.add(() -> service.createHold(10L, UnitStatus.AVAILABLE, customerId, START, END, PRICE, EXPIRES));
            }
            List<Outcome> outcomes = race(tasks);
            check(successes(outcomes) == 1, "round " + round + ": exactly one same-window hold wins");
            check(service.rentalsOf(10L).size() == 1, "round " + round + ": one rental stored");
        }
    }

    private static void adjacentWindowsRace() throws InterruptedException {
        RentalHoldService service = new RentalHoldService();
        List<Callable<?>> tasks = new ArrayList<>();
        for (int day = 0; day < 8; day++) {
            LocalDate windowStart = START.plusDays(day);
            tasks.add(() -> service.createHold(10L, UnitStatus.AVAILABLE, 1L, windowStart, windowStart.plusDays(1),
                    PRICE, EXPIRES));
        }
        List<Outcome> outcomes = race(tasks);
        check(successes(outcomes) == 8, "adjacent windows never conflict");
        check(service.rentalsOf(10L).size() == 8, "all adjacent holds stored");
    }

    private static void parallelUnitsRace() throws InterruptedException {
        RentalHoldService service = new RentalHoldService();
        List<Callable<?>> tasks = new ArrayList<>();
        for (int i = 0; i < 16; i++) {
            long unitId = 100 + i;
            tasks.add(() -> service.createHold(unitId, UnitStatus.AVAILABLE, 1L, START, END, PRICE, EXPIRES));
        }
        check(successes(race(tasks)) == 16, "holds on independent units all succeed");
    }

    private static void renewVsHoldRace() throws InterruptedException {
        for (int round = 0; round < 20; round++) {
            RentalHoldService service = new RentalHoldService();
            Rental rental = activeRental(service, 10L);
            Callable<?> renewTask = () -> {
                RentalRenewal renewal = service.requestRenewal(rental, UnitStatus.AVAILABLE, EXTENDED_END, DECIDED_AT);
                service.applyRenewal(renewal, UnitStatus.AVAILABLE, DECIDED_AT);
                return renewal;
            };
            Callable<?> holdTask = () -> service.createHold(10L, UnitStatus.AVAILABLE, 9L, END, EXTENDED_END,
                    PRICE, EXPIRES.plusSeconds(86400));
            List<Outcome> outcomes = race(List.of(renewTask, holdTask));
            check(successes(outcomes) == 1, "round " + round + ": renewal and hold cannot both win");
            if (outcomes.get(0).ok()) {
                check(EXTENDED_END.equals(rental.getEndDate()), "round " + round + ": renewal extended the rental");
                check(service.rentalsOf(10L).size() == 1, "round " + round + ": no competing hold stored");
            } else {
                check(END.equals(rental.getEndDate()), "round " + round + ": rental end untouched");
                check(service.rentalsOf(10L).size() == 2, "round " + round + ": competing hold stored");
            }
        }
    }

    private static void expireVsHoldRace() throws InterruptedException {
        for (int round = 0; round < 20; round++) {
            RentalHoldService service = new RentalHoldService();
            Rental hold = service.createHold(10L, UnitStatus.AVAILABLE, 1L, START, END, PRICE, EXPIRES);
            Callable<?> sweepTask = () -> service.expireHolds(EXPIRES);
            Callable<?> holdTask = () -> service.createHold(10L, UnitStatus.AVAILABLE, 2L, START, END,
                    PRICE, EXPIRES.plusSeconds(60));
            List<Outcome> outcomes = race(List.of(sweepTask, holdTask));
            check(hold.getStatus() == RentalStatus.EXPIRED, "round " + round + ": expired hold is always swept");
            if (outcomes.get(1).ok()) {
                check(service.rentalsOf(10L).size() == 2, "round " + round + ": new hold stored after sweep");
            } else {
                check(outcomes.get(1).error() instanceof UnitNotAvailableException,
                        "round " + round + ": unswept hold yields an explicit conflict");
                check(service.rentalsOf(10L).size() == 1, "round " + round + ": no rental stored on conflict");
            }
        }
    }

    private static void cancelVsExpireRace() throws InterruptedException {
        RentalHoldService cancelledFirst = new RentalHoldService();
        Rental holdA = cancelledFirst.createHold(10L, UnitStatus.AVAILABLE, 1L, START, END, PRICE, EXPIRES);
        cancelledFirst.cancel(holdA);
        check(holdA.getStatus() == RentalStatus.CANCELLED, "cancel wins: hold cancelled");
        check(cancelledFirst.expireHolds(EXPIRES.plusSeconds(60)) == 0, "cancel wins: sweep skips the hold");

        RentalHoldService sweptFirst = new RentalHoldService();
        Rental holdB = sweptFirst.createHold(10L, UnitStatus.AVAILABLE, 1L, START, END, PRICE, EXPIRES);
        check(sweptFirst.expireHolds(EXPIRES) == 1, "sweep wins: hold expired");
        expectFailure(() -> sweptFirst.cancel(holdB), "sweep wins: cancel is rejected");

        for (int round = 0; round < 20; round++) {
            RentalHoldService service = new RentalHoldService();
            Rental hold = service.createHold(10L, UnitStatus.AVAILABLE, 1L, START, END, PRICE, EXPIRES);
            Callable<?> cancelTask = () -> {
                service.cancel(hold);
                return hold;
            };
            Callable<?> sweepTask = () -> service.expireHolds(EXPIRES);
            List<Outcome> outcomes = race(List.of(cancelTask, sweepTask));
            Outcome cancelOutcome = outcomes.get(0);
            int swept = (Integer) outcomes.get(1).value();
            if (cancelOutcome.ok()) {
                check(hold.getStatus() == RentalStatus.CANCELLED, "round " + round + ": cancel outcome is consistent");
                check(swept == 0, "round " + round + ": sweep skipped the cancelled hold");
            } else {
                check(cancelOutcome.error() instanceof IllegalStateException,
                        "round " + round + ": losing cancel is an explicit rejection");
                check(hold.getStatus() == RentalStatus.EXPIRED, "round " + round + ": sweep outcome is consistent");
                check(swept == 1, "round " + round + ": sweep expired exactly one hold");
            }
        }
    }

    private static void reviveVsHoldRace() throws InterruptedException {
        for (int round = 0; round < 20; round++) {
            RentalHoldService service = new RentalHoldService();
            Rental hold = service.createHold(10L, UnitStatus.AVAILABLE, 1L, START, END, PRICE, EXPIRES);
            service.expireHolds(EXPIRES);
            Callable<?> reviveTask = () -> service.resolveLatePayment(hold, UnitStatus.AVAILABLE,
                    EXPIRES.plusSeconds(60));
            Callable<?> holdTask = () -> service.createHold(10L, UnitStatus.AVAILABLE, 2L, START, END,
                    PRICE, EXPIRES.plusSeconds(60));
            List<Outcome> outcomes = race(List.of(reviveTask, holdTask));
            if (outcomes.get(1).ok()) {
                check(outcomes.get(0).value() == LatePaymentOutcome.NEEDS_RECONCILIATION,
                        "round " + round + ": late payment yields to the new hold");
                check(hold.getStatus() == RentalStatus.EXPIRED, "round " + round + ": losing hold stays expired");
                check(service.rentalsOf(10L).size() == 2, "round " + round + ": new hold stored");
            } else {
                check(outcomes.get(0).value() == LatePaymentOutcome.REACTIVATED,
                        "round " + round + ": revival wins the window");
                check(hold.getStatus() == RentalStatus.RESERVED, "round " + round + ": revived hold is reserved");
                check(service.rentalsOf(10L).size() == 1, "round " + round + ": no competing hold stored");
            }
        }
    }

    private static Rental activeRental(RentalHoldService service, long unitId) {
        Rental rental = service.createHold(unitId, UnitStatus.AVAILABLE, 1L, START, END, PRICE, EXPIRES);
        rental.transitionTo(RentalStatus.RESERVED);
        rental.checkIn(CHECK_IN_AT, AccessMethod.KEY, "Unit ready");
        return rental;
    }

    private static List<Outcome> race(List<Callable<?>> tasks) throws InterruptedException {
        ExecutorService pool = Executors.newFixedThreadPool(tasks.size());
        CountDownLatch ready = new CountDownLatch(tasks.size());
        CountDownLatch go = new CountDownLatch(1);
        List<Future<Outcome>> futures = new ArrayList<>();
        for (Callable<?> task : tasks) {
            futures.add(pool.submit(() -> {
                ready.countDown();
                go.await();
                try {
                    return new Outcome(task.call(), null);
                } catch (RuntimeException e) {
                    return new Outcome(null, e);
                } catch (Exception e) {
                    throw new AssertionError("unexpected checked exception", e);
                }
            }));
        }
        ready.await();
        go.countDown();
        pool.shutdown();
        if (!pool.awaitTermination(30, TimeUnit.SECONDS)) {
            throw new AssertionError("FAILED: race timed out");
        }
        List<Outcome> outcomes = new ArrayList<>();
        for (Future<Outcome> future : futures) {
            try {
                outcomes.add(future.get());
            } catch (java.util.concurrent.ExecutionException e) {
                throw new AssertionError("unexpected task failure", e.getCause());
            }
        }
        return outcomes;
    }

    private static long successes(List<Outcome> outcomes) {
        return outcomes.stream().filter(Outcome::ok).count();
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

    private record Outcome(Object value, RuntimeException error) {

        boolean ok() {
            return error == null;
        }
    }
}
