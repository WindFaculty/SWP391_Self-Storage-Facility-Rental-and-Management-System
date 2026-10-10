package com.storage.account.controller;

import com.storage.account.dto.AdminDtos.ActivityLogResponse;
import com.storage.account.dto.AdminDtos.CreateUserRequest;
import com.storage.account.dto.AdminDtos.FacilityAssignmentRequest;
import com.storage.account.dto.AdminDtos.UserStatusRequest;
import com.storage.account.dto.UserDto;
import com.storage.account.entity.UserRole;
import com.storage.account.entity.UserStatus;
import com.storage.account.service.ActivityLogService;
import com.storage.account.service.UserAdminService;
import com.storage.shared.response.ApiResponse;
import com.storage.shared.response.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final UserAdminService userAdminService;
    private final ActivityLogService activityLogService;

    public AdminController(UserAdminService userAdminService, ActivityLogService activityLogService) {
        this.userAdminService = userAdminService;
        this.activityLogService = activityLogService;
    }

    @GetMapping("/users")
    public ApiResponse<PageResponse<UserDto>> listUsers(
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) Long facilityId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(userAdminService.listUsers(role, status, facilityId, page, size));
    }

    @PostMapping("/users")
    public ResponseEntity<ApiResponse<UserDto>> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(userAdminService.createUser(request)));
    }

    @PutMapping("/users/{userId}/status")
    public ApiResponse<UserDto> updateUserStatus(@PathVariable Long userId,
                                                 @Valid @RequestBody UserStatusRequest request) {
        return ApiResponse.success(userAdminService.updateStatus(userId, request.status()));
    }

    @PutMapping("/users/{userId}/facility")
    public ApiResponse<UserDto> assignFacility(@PathVariable Long userId,
                                               @Valid @RequestBody FacilityAssignmentRequest request) {
        return ApiResponse.success(userAdminService.assignFacility(userId, request.facilityId()));
    }

    @GetMapping("/audit-logs")
    public ApiResponse<PageResponse<ActivityLogResponse>> listAuditLogs(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String action,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(activityLogService.list(userId, action, page, size));
    }
}
