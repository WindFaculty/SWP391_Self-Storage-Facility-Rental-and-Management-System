package com.storage.support.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "support_tickets")
public class SupportTicket {

    public enum Category { UNIT, LOCK, ACCESS, PAYMENT, ITEMS, OTHER }

    public enum Status { OPEN, IN_PROGRESS, RESOLVED, CLOSED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "facility_id", nullable = false)
    private Long facilityId;

    @Column(name = "rental_id")
    private Long rentalId;

    @Column(name = "assigned_staff_id")
    private Long assignedStaffId;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 20)
    private Category category;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 16)
    private Status status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    protected SupportTicket() {
    }

    public static SupportTicket open(Long customerId, Long facilityId, Long rentalId,
                                     Category category, String title, String description) {
        if (customerId == null || facilityId == null || category == null) {
            throw new IllegalArgumentException("customerId, facilityId and category are required");
        }
        if (title == null || title.isBlank() || description == null || description.isBlank()) {
            throw new IllegalArgumentException("title and description are required");
        }
        if (title.length() > 200) {
            throw new IllegalArgumentException("title must be at most 200 characters");
        }
        SupportTicket ticket = new SupportTicket();
        ticket.customerId = customerId;
        ticket.facilityId = facilityId;
        ticket.rentalId = rentalId;
        ticket.category = category;
        ticket.title = title;
        ticket.description = description;
        ticket.status = Status.OPEN;
        ticket.createdAt = Instant.now();
        return ticket;
    }

    public boolean assign(Long staffId) {
        if (staffId == null || status == Status.RESOLVED || status == Status.CLOSED) {
            return false;
        }
        assignedStaffId = staffId;
        return true;
    }

    public boolean start() {
        if (status != Status.OPEN) {
            return false;
        }
        status = Status.IN_PROGRESS;
        return true;
    }

    public boolean resolve(Instant resolvedAt) {
        if (status != Status.IN_PROGRESS) {
            return false;
        }
        status = Status.RESOLVED;
        this.resolvedAt = resolvedAt;
        return true;
    }

    public boolean close() {
        if (status != Status.RESOLVED) {
            return false;
        }
        status = Status.CLOSED;
        return true;
    }

    public Long getId() {
        return id;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public Long getFacilityId() {
        return facilityId;
    }

    public Long getRentalId() {
        return rentalId;
    }

    public Long getAssignedStaffId() {
        return assignedStaffId;
    }

    public Category getCategory() {
        return category;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public Status getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }
}
