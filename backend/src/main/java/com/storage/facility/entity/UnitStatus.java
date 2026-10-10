package com.storage.facility.entity;

public enum UnitStatus {
    AVAILABLE,
    OCCUPIED,
    INSPECTION,
    MAINTENANCE;

    public boolean blocksNewRental() {
        return this == INSPECTION || this == MAINTENANCE;
    }
}
