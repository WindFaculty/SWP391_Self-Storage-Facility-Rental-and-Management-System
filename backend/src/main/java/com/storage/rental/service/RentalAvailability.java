package com.storage.rental.service;

import com.storage.facility.entity.UnitStatus;
import com.storage.rental.entity.Rental;

import java.time.LocalDate;
import java.util.Collection;
import java.util.Objects;

public final class RentalAvailability {

    private RentalAvailability() {
    }

    public static boolean isAvailable(UnitStatus unitStatus, Collection<Rental> unitRentals,
                                      LocalDate startDate, LocalDate endDate) {
        Objects.requireNonNull(unitStatus, "unitStatus");
        Objects.requireNonNull(unitRentals, "unitRentals");
        Objects.requireNonNull(startDate, "startDate");
        Objects.requireNonNull(endDate, "endDate");
        if (!endDate.isAfter(startDate)) {
            throw new IllegalArgumentException("endDate must be after startDate: actual=[" +
                    startDate + ", " + endDate + ")");
        }
        if (unitStatus.blocksNewRental()) {
            return false;
        }
        return unitRentals.stream()
                .noneMatch(rental -> rental.getStatus().blocksAvailability()
                        && rental.overlaps(startDate, endDate));
    }
}
