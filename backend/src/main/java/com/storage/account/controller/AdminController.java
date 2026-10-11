package com.storage.account.controller;

import com.storage.account.dto.AdminDtos.UserStatusRequest;
import com.storage.account.entity.UserRole;
import com.storage.account.entity.UserStatus;
import com.storage.account.service.AdminOpsService;
import com.storage.ops.dto.OpsDtos;
import com.storage.ops.dto.OpsDtos.ActivityLogDto;
import com.storage.ops.dto.OpsDtos.AdminUserDto;
import com.storage.ops.dto.OpsDtos.UserList;
import com.storage.shared.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Admin account management. Paths match frontend/src/features/admin/api/adminApi.ts.
 */
@RestController
@RequestMapping("/admin")
public class AdminController {

    private final AdminOpsService adminOpsService;

    public AdminController(AdminOpsService adminOpsService) {
        this.adminOpsService = adminOpsService;
    }

    @GetMapping("/users")
    public ApiResponse<UserList> listUsers(
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) Long facilityId,
            @RequestParam(required = false) String search) {
        return ApiResponse.success(
                adminOpsService.listUsers(role, status, facilityId, search));
    }

    @PostMapping("/users")
    public ResponseEntity<ApiResponse<AdminUserDto>> createUserWorkspace(
            @Valid @RequestBody OpsDtos.AdminUserInput input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                adminOpsService.createUser(input.fullName(), input.email(), input.phone(),
                        input.password(), input.role(), input.facilityId())));
    }

    @PutMapping("/users/{userId}")
    public ApiResponse<AdminUserDto> updateUserWorkspace(@PathVariable Long userId,
            @Valid @RequestBody OpsDtos.AdminUserInput input) {
        return ApiResponse.success(adminOpsService.updateUser(userId, input.fullName(), input.email(),
                input.phone(), input.role(), input.facilityId()));
    }

    @RequestMapping(value = "/users/{userId}/status",
            method = {RequestMethod.PUT, RequestMethod.PATCH})
    public ApiResponse<AdminUserDto> updateUserStatus(@PathVariable Long userId,
                                                      @Valid @RequestBody UserStatusRequest body) {
        return ApiResponse.success(adminOpsService.updateUserStatus(userId, body.status()));
    }

    @GetMapping("/activity-logs")
    public ApiResponse<List<ActivityLogDto>> activityLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String search) {
        return ApiResponse.success(adminOpsService.activityLogs(action, search));
    }
}
