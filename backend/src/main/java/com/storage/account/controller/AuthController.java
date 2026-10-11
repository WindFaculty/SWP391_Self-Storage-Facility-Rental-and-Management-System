package com.storage.account.controller;

import com.storage.account.dto.AuthResponse;
import com.storage.account.dto.LoginRequest;
import com.storage.account.dto.RefreshTokenRequest;
import com.storage.account.dto.RegisterRequest;
import com.storage.account.dto.UserDto;
import com.storage.account.service.AuthService;
import com.storage.shared.exception.BusinessException;
import com.storage.shared.exception.ErrorCode;
import com.storage.shared.response.ApiResponse;
import com.storage.shared.security.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(authService.register(request)));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success(authService.login(request));
    }

    @PostMapping("/social/{provider}")
    public ApiResponse<AuthResponse> socialLogin(@org.springframework.web.bind.annotation.PathVariable String provider,
            @Valid @RequestBody com.storage.account.dto.SocialLoginRequest request) {
        return ApiResponse.success(authService.socialLogin(provider, request.token()));
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ApiResponse.success(authService.refresh(request));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request);
        return ApiResponse.success(null, "Đăng xuất thành công");
    }

    @GetMapping("/me")
    public ApiResponse<UserDto> me() {
        String email = SecurityUtils.getCurrentUserEmail()
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        return ApiResponse.success(authService.me(email));
    }
}
