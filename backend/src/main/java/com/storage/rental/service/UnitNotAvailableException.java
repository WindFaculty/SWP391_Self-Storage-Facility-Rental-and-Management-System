package com.storage.rental.service;

import java.time.LocalDate;

public class UnitNotAvailableException extends RuntimeException {

    public UnitNotAvailableException(long unitId, LocalDate startDate, LocalDate endDate) {
        super("Unit " + unitId + " is not available for [" + startDate + ", " + endDate + ")");
    }
}
