package com.storage.rental.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "staff_tasks")
public class StaffTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "assigned_staff_id", nullable = false)
    private Long assignedStaffId;

    @Column(name = "rental_id")
    private Long rentalId;

    @Column(name = "ticket_id")
    private Long ticketId;

    @Enumerated(EnumType.STRING)
    @Column(name = "task_type", nullable = false, length = 20)
    private TaskType taskType;

    @Column(name = "scheduled_at", nullable = false)
    private Instant scheduledAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 12)
    private TaskStatus status;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "notes")
    private String notes;

    protected StaffTask() {
    }

    public StaffTask(Long assignedStaffId, Long rentalId, Long ticketId, TaskType taskType,
                     Instant scheduledAt) {
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

    public StaffTask start() {
        transitionTo(TaskStatus.IN_PROGRESS);
        return this;
    }

    /**
     * Starts the task only when it is still ASSIGNED: completing an action may
     * happen without a separate "start" click, so this must not fail on a task
     * that is already IN_PROGRESS.
     */
    public StaffTask startIfNotStarted() {
        if (status == TaskStatus.ASSIGNED) {
            transitionTo(TaskStatus.IN_PROGRESS);
        }
        return this;
    }

    public void complete(Instant at) {
        Objects.requireNonNull(at, "at");
        transitionTo(TaskStatus.DONE);
        this.completedAt = at;
    }

    public void cancel() {
        transitionTo(TaskStatus.CANCELLED);
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    private void transitionTo(TaskStatus next) {
        if (!status.canTransitionTo(next)) {
            throw new IllegalStateException("Illegal staff task transition: " + status + " -> " + next);
        }
        status = next;
    }

    public Long getId() {
        return id;
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

    public String getNotes() {
        return notes;
    }
}
