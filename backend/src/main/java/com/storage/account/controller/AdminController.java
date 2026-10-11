package com.storage.account.controller;

import com.storage.account.dto.AdminDtos.FacilityAssignmentRequest;
import com.storage.account.dto.UserDto;
import com.storage.account.entity.UserRole;
import com.storage.account.entity.UserStatus;
import com.storage.account.service.ActivityLogService;
import com.storage.account.service.AdminOpsService;
import com.storage.account.service.UserAdminService;
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
 * Admin account management. The workshop endpoints (users list, PUT user,
 * PATCH status, activity-logs) match frontend/src/features/admin/api/adminApi.ts;
 * the original paged endpoints used by the REST contract stay in place.
 */
@RestController
@RequestMapping("/admin")
public class AdminController {

    private final UserAdminService userAdminService;
    private final ActivityLogService activityLogService;
    private final AdminOpsService adminOpsService;

    public AdminController(UserAdminService userAdminService,
                           ActivityLogService activityLogService,
                           AdminOpsService adminOpsService) {
        this.userAdminService = userAdminService;
        this.activityLogService = activityLogService;
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
                                                      @Valid @RequestBody UserStatusBody body) {
        return ApiResponse.success(adminOpsService.updateUserStatus(userId, body.status()));
    }

    @GetMapping("/activity-logs")
    public ApiResponse<List<ActivityLogDto>> activityLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String search) {
        return ApiResponse.success(adminOpsService.activityLogs(action, search));
    }

    @PutMapping("/users/{userId}/facility")
    public ApiResponse<UserDto> assignFacility(@PathVariable Long userId,
                                               @Valid @RequestBody FacilityAssignmentRequest request) {
        return ApiResponse.success(userAdminService.assignFacility(userId, request.facilityId()));
    }

    @GetMapping("/audit-logs")
    public ApiResponse<com.storage.shared.response.PageResponse<com.storage.account.dto.AdminDtos.ActivityLogResponse>> listAuditLogs(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String action,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(activityLogService.list(userId, action, page, size));
    }

    public record UserStatusBody(@jakarta.validation.constraints.NotNull UserStatus status) {
    }
}
