package com.storage.account.dto;

import com.storage.account.entity.User;
import com.storage.account.entity.UserRole;
import com.storage.account.entity.UserStatus;

public record UserDto(
        Long id,
        String email,
        String fullName,
        String phone,
        UserRole role,
        Long facilityId,
        UserStatus status) {

    public static UserDto from(User user) {
        return new UserDto(user.getId(), user.getEmail(), user.getFullName(), user.getPhone(),
                user.getRole(), user.getFacilityId(), user.getStatus());
    }
}
