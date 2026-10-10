package com.storage.account.service;

import com.storage.account.dto.AdminDtos.CreateUserRequest;
import com.storage.account.dto.UserDto;
import com.storage.account.entity.User;
import com.storage.account.entity.UserRole;
import com.storage.account.entity.UserStatus;
import com.storage.account.repository.UserRepository;
import com.storage.facility.repository.FacilityRepository;
import com.storage.shared.exception.BusinessException;
import com.storage.shared.exception.ErrorCode;
import com.storage.shared.exception.NotFoundException;
import com.storage.shared.response.PageResponse;
import com.storage.shared.security.SecurityUtils;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class UserAdminService {

    private final UserRepository users;
    private final FacilityRepository facilities;
    private final PasswordEncoder passwordEncoder;
    private final ActivityLogService audit;

    public UserAdminService(UserRepository users,
                            FacilityRepository facilities,
                            PasswordEncoder passwordEncoder,
                            ActivityLogService audit) {
        this.users = users;
        this.facilities = facilities;
        this.passwordEncoder = passwordEncoder;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public PageResponse<UserDto> listUsers(UserRole role, UserStatus status, Long facilityId,
                                           int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by("id"));
        return PageResponse.from(users.search(role, status, facilityId, pageable).map(UserDto::from));
    }

    @Transactional
    public UserDto createUser(CreateUserRequest request) {
        String email = request.email().toLowerCase().trim();
        if (users.existsByEmail(email)) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        UserRole role = request.role();
        boolean facilityScoped = role == UserRole.FACILITY_STAFF || role == UserRole.FACILITY_MANAGER;
        if (facilityScoped && request.facilityId() == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Vai trò " + role + " bắt buộc phải gán cơ sở");
        }
        if (!facilityScoped && request.facilityId() != null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Vai trò " + role + " không được gán cơ sở");
        }
        if (request.facilityId() != null && !facilities.existsById(request.facilityId())) {
            throw new NotFoundException(ErrorCode.FACILITY_NOT_FOUND);
        }

        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName().trim());
        user.setPhone(request.phone());
        user.setRole(role);
        user.setFacilityId(request.facilityId());
        user.setStatus(UserStatus.ACTIVE);
        users.save(user);

        audit.record(SecurityUtils.getCurrentUserId().orElse(null), "ADMIN_CREATE_USER", "USER", user.getId(),
                Map.<String, Object>of("email", email, "role", role.name()));
        return UserDto.from(user);
    }

    @Transactional
    public UserDto updateStatus(Long userId, UserStatus status) {
        User user = user(userId);
        if (status == UserStatus.DISABLED
                && user.getId().equals(SecurityUtils.getCurrentUserId().orElse(null))) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Không thể vô hiệu hóa tài khoản của chính mình");
        }
        user.setStatus(status);
        audit.record(SecurityUtils.getCurrentUserId().orElse(null), "ADMIN_UPDATE_USER_STATUS", "USER", user.getId(),
                Map.<String, Object>of("status", status.name()));
        return UserDto.from(user);
    }

    @Transactional
    public UserDto assignFacility(Long userId, Long facilityId) {
        User user = user(userId);
        if (user.getRole() != UserRole.FACILITY_STAFF && user.getRole() != UserRole.FACILITY_MANAGER) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Chỉ gán cơ sở cho FACILITY_STAFF/FACILITY_MANAGER");
        }
        if (!facilities.existsById(facilityId)) {
            throw new NotFoundException(ErrorCode.FACILITY_NOT_FOUND);
        }
        user.setFacilityId(facilityId);
        audit.record(SecurityUtils.getCurrentUserId().orElse(null), "ADMIN_ASSIGN_FACILITY", "USER", user.getId(),
                Map.<String, Object>of("facilityId", facilityId));
        return UserDto.from(user);
    }

    private User user(Long userId) {
        return users.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));
    }
}
