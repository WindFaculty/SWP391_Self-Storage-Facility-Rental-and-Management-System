package com.storage.account.dto;

import com.storage.account.entity.User;
import com.storage.account.entity.UserRole;
import com.storage.account.entity.UserStatus;
import java.util.UUID;

public record UserDto(UUID id, String email, String fullName, String phone, UserRole role,
                      UUID assignedFacilityId, UserStatus status) {
    public static UserDto from(User user) {
        return new UserDto(user.getId(), user.getEmail(), user.getFullName(), user.getPhone(), user.getRole(),
                user.getAssignedFacilityId(), user.getStatus());
    }
}
