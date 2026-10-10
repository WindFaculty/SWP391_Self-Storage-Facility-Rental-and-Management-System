package com.storage.rental;

import com.storage.facility.entity.UnitStatus;
import com.storage.rental.entity.Rental;
import com.storage.rental.entity.RentalStatus;
import com.storage.rental.service.RentalHoldService;
import com.storage.rental.service.UnitNotAvailableException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

public final class RentalHoldSelfCheck {

    private static final LocalDate START = LocalDate.of(2026, 10, 10);
    private static final LocalDate END = LocalDate.of(2026, 11, 10);
    private static final BigDecimal PRICE = new BigDecimal("1500000.00");
    private static final Instant EXPIRES = Instant.parse("2026-10-10T00:15:00Z");

    private RentalHoldSelfCheck() {
    }

    public static void main(String[] args) throws InterruptedException {
        RentalHoldService service = new RentalHoldService();

        Rental hold = service.createHold(10L, UnitStatus.AVAILABLE, 1L, START, END, PRICE, EXPIRES);
        check(hold.getStatus() == RentalStatus.PENDING_PAYMENT, "hold starts pending payment");
        check(hold.getPricePerMonth().equals(PRICE), "hold keeps price snapshot");
        check(service.rentalsOf(10L).equals(List.of(hold)), "hold is stored for its unit");

        expectConflict(() -> service.createHold(10L, UnitStatus.AVAILABLE, 2L, START, END, PRICE, EXPIRES),
                "same unit and range is rejected");
        check(service.rentalsOf(10L).size() == 1, "rejected hold is not stored");

        service.createHold(10L, UnitStatus.AVAILABLE, 2L, END, LocalDate.of(2026, 12, 10), PRICE, EXPIRES);
        check(service.rentalsOf(10L).size() == 2, "adjacent range shares the unit");

        service.createHold(11L, UnitStatus.AVAILABLE, 2L, START, END, PRICE, EXPIRES);
        check(service.rentalsOf(11L).size() == 1, "other unit holds independently");

        expectConflict(() -> service.createHold(12L, UnitStatus.MAINTENANCE, 1L, START, END, PRICE, EXPIRES),
                "maintenance unit rejects holds");
        expectConflict(() -> service.createHold(12L, UnitStatus.INSPECTION, 1L, START, END, PRICE, EXPIRES),
                "inspection unit rejects holds");
        check(service.rentalsOf(12L).isEmpty(), "holds rejected by unit status are not stored");

        hold.transitionTo(RentalStatus.CANCELLED);
        Rental rehold = service.createHold(10L, UnitStatus.AVAILABLE, 3L, START, END, PRICE, EXPIRES);
        check(rehold.getStatus() == RentalStatus.PENDING_PAYMENT, "cancelled hold frees the unit");

        concurrentRace();
        System.out.println("RentalHoldSelfCheck: all checks passed");
    }

    private static void concurrentRace() throws InterruptedException {
        RentalHoldService service = new RentalHoldService();
        int threads = 8;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch ready = new CountDownLatch(threads);
        CountDownLatch go = new CountDownLatch(1);
        AtomicInteger created = new AtomicInteger();
        AtomicInteger rejected = new AtomicInteger();

        for (int i = 0; i < threads; i++) {
            long customerId = i + 1;
            pool.submit(() -> {
                ready.countDown();
                try {
                    go.await();
                    service.createHold(10L, UnitStatus.AVAILABLE, customerId, START, END, PRICE, EXPIRES);
                    created.incrementAndGet();
                } catch (UnitNotAvailableException expected) {
                    rejected.incrementAndGet();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }
        ready.await();
        go.countDown();
        pool.shutdown();
        if (!pool.awaitTermination(10, TimeUnit.SECONDS)) {
            throw new AssertionError("FAILED: concurrency check timed out");
        }

        check(created.get() == 1, "exactly one concurrent hold wins");
        check(rejected.get() == threads - 1, "remaining concurrent holds are rejected");
        check(service.rentalsOf(10L).size() == 1, "single rental stored after race");
    }

    private static void check(boolean condition, String label) {
        if (!condition) {
            throw new AssertionError("FAILED: " + label);
        }
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
