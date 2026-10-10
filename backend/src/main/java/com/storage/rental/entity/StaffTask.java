package com.storage.rental.entity;

import java.time.Instant;
import java.util.Objects;

public class StaffTask {

    private final Long assignedStaffId;
    private final Long rentalId;
    private final Long ticketId;
    private final TaskType taskType;
    private final Instant scheduledAt;
    private TaskStatus status;
    private Instant completedAt;

    public StaffTask(Long assignedStaffId, Long rentalId, Long ticketId, TaskType taskType, Instant scheduledAt) {
        this.assignedStaffId = Objects.requireNonNull(assignedStaffId, "assignedStaffId");
        this.taskType = Objects.requireNonNull(taskType, "taskType");
        this.scheduledAt = Objects.requireNonNull(scheduledAt, "scheduledAt");
        if (taskType == TaskType.SUPPORT) {
            if (ticketId == null || rentalId != null) {
                throw new IllegalArgumentException("SUPPORT task requires ticketId and no rentalId");
            }
        } else if (rentalId == null || ticketId != null) {
            throw new IllegalArgumentException(taskType + " task requires rentalId and no ticketId");
        }
        this.rentalId = rentalId;
        this.ticketId = ticketId;
        this.status = TaskStatus.ASSIGNED;
    }

    public void start() {
        transitionTo(TaskStatus.IN_PROGRESS);
    }

    public void complete(Instant at) {
        Objects.requireNonNull(at, "at");
        transitionTo(TaskStatus.DONE);
        this.completedAt = at;
    }

    public void cancel() {
        transitionTo(TaskStatus.CANCELLED);
    }

    private void transitionTo(TaskStatus next) {
        if (!status.canTransitionTo(next)) {
            throw new IllegalStateException("Illegal staff task transition: " + status + " -> " + next);
        }
        status = next;
    }

    public Long getAssignedStaffId() {
        return assignedStaffId;
    }

    public Long getRentalId() {
        return rentalId;
    }

    public Long getTicketId() {
        return ticketId;
    }

    public TaskType getTaskType() {
        return taskType;
    }

    public Instant getScheduledAt() {
        return scheduledAt;
    }

    public TaskStatus getStatus() {
        return status;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }
}
