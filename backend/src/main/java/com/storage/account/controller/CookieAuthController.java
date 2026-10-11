package com.storage.account.controller;

import com.storage.account.dto.*;
import com.storage.account.service.AuthService;
import com.storage.shared.exception.*;
import com.storage.shared.response.ApiResponse;
import com.storage.shared.security.AuthCookies;
import jakarta.servlet.http.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class CookieAuthController {
    private final AuthService auth; private final AuthCookies cookies; private final boolean enabled;
    public CookieAuthController(AuthService auth, AuthCookies cookies,
                                @Value("${app.google.enabled:false}") boolean enabled) {
        this.auth = auth; this.cookies = cookies; this.enabled = enabled;
    }
    @GetMapping("/google/config") public ApiResponse<Map<String, Boolean>> config() {
        return ApiResponse.success(Map.of("enabled", enabled));
    }
    @PostMapping("/cookie/login") public ApiResponse<Map<String, UserDto>> login(
            @jakarta.validation.Valid @RequestBody LoginRequest input, HttpServletRequest request, HttpServletResponse response) {
        AuthResponse result = auth.login(input); revokePrior(request); cookies.write(response, result);
        return ApiResponse.success(Map.of("user", result.user()));
    }
    @PostMapping("/cookie/register") public ApiResponse<Map<String, UserDto>> register(
            @jakarta.validation.Valid @RequestBody RegisterRequest input, HttpServletRequest request, HttpServletResponse response) {
        AuthResponse result = auth.register(input); revokePrior(request); cookies.write(response, result);
        return ApiResponse.success(Map.of("user", result.user()));
    }
    @PostMapping("/cookie/social/facebook") public ApiResponse<Map<String, UserDto>> facebook(
            @jakarta.validation.Valid @RequestBody SocialLoginRequest input, HttpServletRequest request, HttpServletResponse response) {
        AuthResponse result = auth.socialLogin("facebook", input.token()); revokePrior(request); cookies.write(response, result);
        return ApiResponse.success(Map.of("user", result.user()));
    }
    private void revokePrior(HttpServletRequest request) {
        String prior = AuthCookies.read(request, AuthCookies.REFRESH);
        if (prior != null && !prior.isBlank()) auth.logout(new RefreshTokenRequest(prior));
    }
    @GetMapping("/cookie/csrf") public ApiResponse<Map<String, String>> csrf(CsrfToken token) {
        return ApiResponse.success(Map.of("token", token.getToken()));
    }
    @PostMapping("/cookie/refresh") public ApiResponse<Map<String, UserDto>> refresh(
            HttpServletRequest request, HttpServletResponse response) {
        String token = AuthCookies.read(request, AuthCookies.REFRESH);
        if (token == null || token.isBlank()) throw new BusinessException(ErrorCode.INVALID_TOKEN);
        AuthResponse result = auth.refresh(new RefreshTokenRequest(token)); cookies.write(response, result);
        return ApiResponse.success(Map.of("user", result.user()));
    }
    @PostMapping("/cookie/logout") public ApiResponse<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        String token = AuthCookies.read(request, AuthCookies.REFRESH);
        if (token != null && !token.isBlank()) auth.logout(new RefreshTokenRequest(token));
        cookies.clear(response); return ApiResponse.success(null);
    }
}
