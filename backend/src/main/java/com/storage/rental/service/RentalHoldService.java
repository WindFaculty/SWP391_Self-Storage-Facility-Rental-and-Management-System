package com.storage.rental.service;

import com.storage.facility.entity.UnitStatus;
import com.storage.rental.entity.Rental;

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
        ReentrantLock lock = unitLocks.computeIfAbsent(unitId, id -> new ReentrantLock());
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

    public List<Rental> rentalsOf(long unitId) {
        return rentalsByUnit.getOrDefault(unitId, List.of());
    }
}
