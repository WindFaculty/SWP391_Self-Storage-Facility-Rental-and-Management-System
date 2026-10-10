package com.storage.rental.entity;

import java.util.Map;
import java.util.Set;

public enum RentalStatus {
    PENDING_PAYMENT,
    RESERVED,
    ACTIVE,
    OVERDUE,
    RETURNED,
    CANCELLED,
    EXPIRED;

    private static final Map<RentalStatus, Set<RentalStatus>> ALLOWED_TRANSITIONS = Map.of(
            PENDING_PAYMENT, Set.of(RESERVED, CANCELLED, EXPIRED),
            RESERVED, Set.of(ACTIVE, CANCELLED),
            ACTIVE, Set.of(OVERDUE, RETURNED),
            OVERDUE, Set.of(RETURNED),
            RETURNED, Set.of(),
            CANCELLED, Set.of(),
            EXPIRED, Set.of());

    public boolean canTransitionTo(RentalStatus next) {
        return ALLOWED_TRANSITIONS.get(this).contains(next);
    }

    public boolean isTerminal() {
        return ALLOWED_TRANSITIONS.get(this).isEmpty();
    }
}
