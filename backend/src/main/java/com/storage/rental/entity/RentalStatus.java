package com.storage.rental.entity;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

public enum RentalStatus {
    PENDING_PAYMENT,
    RESERVED,
    ACTIVE,
    OVERDUE,
    RETURN_REQUESTED,
    RETURNED,
    CANCELLED,
    EXPIRED;

    private static final Map<RentalStatus, Set<RentalStatus>> ALLOWED_TRANSITIONS = Map.of(
            PENDING_PAYMENT, Set.of(RESERVED, CANCELLED, EXPIRED),
            RESERVED, Set.of(ACTIVE, CANCELLED),
            ACTIVE, Set.of(OVERDUE, RETURNED, RETURN_REQUESTED),
            OVERDUE, Set.of(RETURNED, RETURN_REQUESTED),
            RETURN_REQUESTED, Set.of(RETURNED, ACTIVE),
            EXPIRED, Set.of(RESERVED),
            RETURNED, Set.of(),
            CANCELLED, Set.of());

    private static final Set<RentalStatus> AVAILABILITY_BLOCKING =
            EnumSet.of(PENDING_PAYMENT, RESERVED, ACTIVE, OVERDUE, RETURN_REQUESTED);

    public boolean canTransitionTo(RentalStatus next) {
        return ALLOWED_TRANSITIONS.get(this).contains(next);
    }

    public boolean isTerminal() {
        return ALLOWED_TRANSITIONS.get(this).isEmpty();
    }

    public boolean blocksAvailability() {
        return AVAILABILITY_BLOCKING.contains(this);
    }
}
