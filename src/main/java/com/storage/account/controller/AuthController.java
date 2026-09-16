package com.storage.account.controller;
import com.storage.account.dto.*;
import com.storage.account.service.AuthService;
import com.storage.shared.response.ApiResponse;
import com.storage.shared.security.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/auth") public class AuthController { private final AuthService service; public AuthController(AuthService service){this.service=service;} @PostMapping("/register") public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest r){return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(service.register(r)));} @PostMapping("/login") public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest r){return ApiResponse.success(service.login(r));} @GetMapping("/me") public ApiResponse<UserDto> me(){return ApiResponse.success(service.me(SecurityUtils.getCurrentUserEmail().orElseThrow()));} }
