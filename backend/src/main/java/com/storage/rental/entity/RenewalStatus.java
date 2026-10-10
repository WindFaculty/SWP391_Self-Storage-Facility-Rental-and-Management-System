package com.storage.rental.entity;

import java.util.Map;
import java.util.Set;

public enum RenewalStatus {
    REQUESTED,
    REJECTED,
    APPLIED;

    private static final Map<RenewalStatus, Set<RenewalStatus>> ALLOWED_TRANSITIONS = Map.of(
            REQUESTED, Set.of(APPLIED, REJECTED),
            REJECTED, Set.of(),
            APPLIED, Set.of());

    public boolean canTransitionTo(RenewalStatus next) {
        return ALLOWED_TRANSITIONS.get(this).contains(next);
    }

    public boolean isTerminal() {
        return ALLOWED_TRANSITIONS.get(this).isEmpty();
    }
}
