package com.storage.account.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SocialLoginRequest(@NotBlank @Size(max = 8192) String token) {}
