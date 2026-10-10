package com.storage.facility.entity;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

public enum StorageUnitStatus {
    AVAILABLE,
    OCCUPIED,
    INSPECTION,
    MAINTENANCE;

    /*
     * Physical state machine of a storage unit (plan section 7.1): a returned unit
     * goes through INSPECTION and only returns to AVAILABLE after passing;
     * OCCUPIED is entered on handover and left on return.
     */
    private static final Map<StorageUnitStatus, Set<StorageUnitStatus>> ALLOWED_NEXT = Map.of(
            AVAILABLE, EnumSet.of(OCCUPIED, MAINTENANCE),
            OCCUPIED, EnumSet.of(INSPECTION),
            INSPECTION, EnumSet.of(AVAILABLE, MAINTENANCE),
            MAINTENANCE, EnumSet.of(AVAILABLE));

    public boolean canTransitionTo(StorageUnitStatus next) {
        return next != null && next != this && ALLOWED_NEXT.get(this).contains(next);
    }

    public boolean blocksNewRental() {
        return this == INSPECTION || this == MAINTENANCE;
    }

    public StorageUnitStatus onReturned() {
        if (this != OCCUPIED) {
            throw new IllegalStateException("Return requires OCCUPIED unit status: " + this);
        }
        return INSPECTION;
    }

    public StorageUnitStatus onInspection(boolean passed) {
        if (this != INSPECTION) {
            throw new IllegalStateException("Inspection requires INSPECTION unit status: " + this);
        }
        return passed ? AVAILABLE : MAINTENANCE;
    }
}
