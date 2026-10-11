package com.storage.account.dto;

import com.storage.account.entity.UserStatus;
import jakarta.validation.constraints.NotNull;

public final class AdminDtos {

    private AdminDtos() {
    }

    public record UserStatusRequest(@NotNull UserStatus status) {
    }
}
