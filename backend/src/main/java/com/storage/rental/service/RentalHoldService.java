package com.storage.rental.service;

import com.storage.facility.entity.UnitStatus;
import com.storage.rental.entity.Rental;
import com.storage.rental.entity.RentalRenewal;
import com.storage.rental.entity.RentalStatus;
import com.storage.rental.entity.RenewalStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;
import java.util.stream.Stream;

public class RentalHoldService {

    private final ConcurrentHashMap<Long, List<Rental>> rentalsByUnit = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Long, ReentrantLock> unitLocks = new ConcurrentHashMap<>();

    // ponytail: in-process lock only; swap for SELECT ... FOR UPDATE on storage_units when JPA/MySQL lands.
    public Rental createHold(long unitId, UnitStatus unitStatus, long customerId,
                             LocalDate startDate, LocalDate endDate,
                             BigDecimal pricePerMonth, Instant paymentExpiresAt) {
        ReentrantLock lock = lockFor(unitId);
        lock.lock();
        try {
            List<Rental> existing = rentalsByUnit.getOrDefault(unitId, List.of());
            if (!RentalAvailability.isAvailable(unitStatus, existing, startDate, endDate)) {
                throw new UnitNotAvailableException(unitId, startDate, endDate);
            }
            Rental hold = Rental.createHold(customerId, unitId, startDate, endDate, pricePerMonth, paymentExpiresAt);
            rentalsByUnit.merge(unitId, List.of(hold),
                    (current, added) -> Stream.concat(current.stream(), added.stream()).toList());
            return hold;
        } finally {
            lock.unlock();
        }
    }

    public void cancel(Rental rental) {
        ReentrantLock lock = lockFor(rental.getUnitId());
        lock.lock();
        try {
            rental.transitionTo(RentalStatus.CANCELLED);
        } finally {
            lock.unlock();
        }
    }

    public int expireHolds(Instant now) {
        int expired = 0;
        for (Long unitId : rentalsByUnit.keySet()) {
            ReentrantLock lock = lockFor(unitId);
            lock.lock();
            try {
                for (Rental rental : rentalsByUnit.getOrDefault(unitId, List.of())) {
                    if (rental.getStatus() == RentalStatus.PENDING_PAYMENT
                            && !rental.getPaymentExpiresAt().isAfter(now)) {
                        rental.transitionTo(RentalStatus.EXPIRED);
                        expired++;
                    }
                }
            } finally {
                lock.unlock();
            }
        }
        return expired;
    }

    public LatePaymentOutcome resolveLatePayment(Rental rental, UnitStatus unitStatus, Instant now) {
        ReentrantLock lock = lockFor(rental.getUnitId());
        lock.lock();
        try {
            if (rental.getStatus() == RentalStatus.PENDING_PAYMENT) {
                if (rental.getPaymentExpiresAt().isAfter(now)) {
                    throw new IllegalStateException("Hold has not expired yet: " + rental.getPaymentExpiresAt());
                }
                rental.transitionTo(RentalStatus.EXPIRED);
            }
            if (rental.getStatus() != RentalStatus.EXPIRED) {
                throw new IllegalStateException("Late payment only applies to expired holds: " + rental.getStatus());
            }
            List<Rental> existing = rentalsByUnit.getOrDefault(rental.getUnitId(), List.of());
            if (!existing.contains(rental)) {
                throw new IllegalArgumentException("Unknown rental " + rental + " for unit " + rental.getUnitId());
            }
            if (!RentalAvailability.isAvailable(unitStatus, existing, rental.getStartDate(), rental.getEndDate())) {
                return LatePaymentOutcome.NEEDS_RECONCILIATION;
            }
            rental.transitionTo(RentalStatus.RESERVED);
            return LatePaymentOutcome.REACTIVATED;
        } finally {
            lock.unlock();
        }
    }

    public List<Rental> rentalsOf(long unitId) {
        return rentalsByUnit.getOrDefault(unitId, List.of());
    }

    public RentalRenewal requestRenewal(Rental rental, UnitStatus unitStatus,
                                        LocalDate requestedEndDate, Instant requestedAt) {
        ReentrantLock lock = lockFor(rental.getUnitId());
        lock.lock();
        try {
            requireActive(rental);
            List<Rental> existing = rentalsByUnit.getOrDefault(rental.getUnitId(), List.of());
            if (!existing.contains(rental)) {
                throw new IllegalArgumentException("Unknown rental " + rental + " for unit " + rental.getUnitId());
            }
            RentalRenewal renewal = new RentalRenewal(rental, requestedEndDate, requestedAt);
            if (!RentalAvailability.isAvailable(unitStatus, existing, rental.getEndDate(), requestedEndDate)) {
                throw new UnitNotAvailableException(rental.getUnitId(), rental.getEndDate(), requestedEndDate);
            }
            return renewal;
        } finally {
            lock.unlock();
        }
    }

    public void applyRenewal(RentalRenewal renewal, UnitStatus unitStatus, Instant at) {
        Rental rental = renewal.getRental();
        ReentrantLock lock = lockFor(rental.getUnitId());
        lock.lock();
        try {
            if (renewal.getStatus() != RenewalStatus.REQUESTED) {
                throw new IllegalStateException("Renewal already decided: " + renewal.getStatus());
            }
            requireActive(rental);
            List<Rental> existing = rentalsByUnit.getOrDefault(rental.getUnitId(), List.of());
            if (!existing.contains(rental)) {
                throw new IllegalArgumentException("Unknown rental " + rental + " for unit " + rental.getUnitId());
            }
            if (!RentalAvailability.isAvailable(unitStatus, existing,
                    rental.getEndDate(), renewal.getRequestedEndDate())) {
                throw new UnitNotAvailableException(rental.getUnitId(), rental.getEndDate(),
                        renewal.getRequestedEndDate());
            }
            rental.extendTo(renewal.getRequestedEndDate());
            renewal.apply(at);
        } finally {
            lock.unlock();
        }
    }

    public int markOverdue(LocalDate today) {
        int overdue = 0;
        for (Long unitId : rentalsByUnit.keySet()) {
            ReentrantLock lock = lockFor(unitId);
            lock.lock();
            try {
                for (Rental rental : rentalsByUnit.getOrDefault(unitId, List.of())) {
                    if (rental.getStatus() == RentalStatus.ACTIVE && !today.isBefore(rental.getEndDate())) {
                        rental.transitionTo(RentalStatus.OVERDUE);
                        overdue++;
                    }
                }
            } finally {
                lock.unlock();
            }
        }
        return overdue;
    }

    private static void requireActive(Rental rental) {
        RentalStatus status = rental.getStatus();
        if (status != RentalStatus.ACTIVE && status != RentalStatus.OVERDUE) {
            throw new IllegalStateException("Renewal requires an active rental: " + status);
        }
    }

    private ReentrantLock lockFor(long unitId) {
        return unitLocks.computeIfAbsent(unitId, id -> new ReentrantLock());
    }

    public enum LatePaymentOutcome {
        REACTIVATED,
        NEEDS_RECONCILIATION
    }
}
