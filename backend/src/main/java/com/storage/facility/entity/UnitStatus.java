package com.storage.facility.entity;

public enum UnitStatus {
    AVAILABLE,
    OCCUPIED,
    INSPECTION,
    MAINTENANCE;

    public boolean blocksNewRental() {
        return this == INSPECTION || this == MAINTENANCE;
    }

    public UnitStatus onReturned() {
        if (this != OCCUPIED) {
            throw new IllegalStateException("Return requires OCCUPIED unit status: " + this);
        }
        return INSPECTION;
    }

    public UnitStatus onInspection(boolean passed) {
        if (this != INSPECTION) {
            throw new IllegalStateException("Inspection requires INSPECTION unit status: " + this);
        }
        return passed ? AVAILABLE : MAINTENANCE;
    }
}
