package com.storage.rental.entity;

import java.util.Map;
import java.util.Set;

public enum TaskStatus {
    ASSIGNED,
    IN_PROGRESS,
    DONE,
    CANCELLED;

    private static final Map<TaskStatus, Set<TaskStatus>> ALLOWED_TRANSITIONS = Map.of(
            ASSIGNED, Set.of(IN_PROGRESS, DONE, CANCELLED),
            IN_PROGRESS, Set.of(DONE, CANCELLED),
            DONE, Set.of(),
            CANCELLED, Set.of());

    public boolean canTransitionTo(TaskStatus next) {
        return ALLOWED_TRANSITIONS.get(this).contains(next);
    }

    public boolean isTerminal() {
        return ALLOWED_TRANSITIONS.get(this).isEmpty();
    }
}
