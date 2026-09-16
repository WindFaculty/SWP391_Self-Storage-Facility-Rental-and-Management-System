package com.storage.account.entity;

import com.storage.shared.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "activity_logs")
public class ActivityLog extends BaseEntity {
    @Column(name = "user_id") private UUID userId;
    @Column(nullable = false, length = 80) private String action;
    @Column(name = "entity_type", length = 80) private String entityType;
    @Column(name = "entity_id") private UUID entityId;
    @Column(length = 1000) private String description;
    @Column(name = "ip_address", length = 64) private String ipAddress;
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }
    public UUID getEntityId() { return entityId; }
    public void setEntityId(UUID entityId) { this.entityId = entityId; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
}
