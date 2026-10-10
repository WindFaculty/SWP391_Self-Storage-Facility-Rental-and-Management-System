package com.storage.account.dto;

import com.storage.account.entity.ActivityLog;
import com.storage.account.entity.UserRole;
import com.storage.account.entity.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.Map;

public final class AdminDtos {

    private AdminDtos() {
    }

    public record CreateUserRequest(
            @NotBlank @Email @Size(max = 255) String email,
            @NotBlank @Size(min = 8, max = 100) String password,
            @NotBlank @Size(max = 120) String fullName,
            @Size(max = 30) String phone,
            @NotNull UserRole role,
            Long facilityId) {
    }

    public record UserStatusRequest(@NotNull UserStatus status) {
    }

    public record FacilityAssignmentRequest(@NotNull Long facilityId) {
    }

    public record ActivityLogResponse(
            Long id,
            Long userId,
            String action,
            String entityType,
            Long entityId,
            String ipAddress,
            Map<String, Object> metadata,
            Instant createdAt) {

        public static ActivityLogResponse from(ActivityLog log) {
            return new ActivityLogResponse(log.getId(), log.getUserId(), log.getAction(),
                    log.getEntityType(), log.getEntityId(), log.getIpAddress(), log.getMetadata(),
                    log.getCreatedAt());
        }
    }
}
