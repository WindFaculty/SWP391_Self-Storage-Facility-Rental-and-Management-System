package com.storage.account.service;

import com.storage.account.dto.UserDto;
import com.storage.account.entity.ActivityLog;
import com.storage.account.entity.User;
import com.storage.account.entity.UserRole;
import com.storage.account.entity.UserStatus;
import com.storage.account.repository.ActivityLogRepository;
import com.storage.account.repository.UserRepository;
import com.storage.facility.repository.FacilityRepository;
import com.storage.ops.dto.OpsDtos;
import com.storage.shared.exception.BusinessException;
import com.storage.shared.exception.ErrorCode;
import com.storage.shared.exception.NotFoundException;
import com.storage.shared.security.SecurityUtils;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Admin account management plus the activity-log read model the FE2 admin page
 * renders (actor name is joined in, because the raw row only stores a user id).
 */
@Service
public class AdminOpsService {

    private static final Set<UserRole> ELEVATED = Set.of(UserRole.ADMIN, UserRole.BUSINESS_MANAGER);
    private static final int LOG_LIMIT = 200;

    private final UserAdminService userAdminService;
    private final UserRepository users;
    private final FacilityRepository facilities;
    private final PasswordEncoder passwordEncoder;
    private final ActivityLogService audit;
    private final ActivityLogRepository logs;

    public AdminOpsService(UserAdminService userAdminService,
                           UserRepository users,
                           FacilityRepository facilities,
                           PasswordEncoder passwordEncoder,
                           ActivityLogService audit,
                           ActivityLogRepository logs) {
        this.userAdminService = userAdminService;
        this.users = users;
        this.facilities = facilities;
        this.passwordEncoder = passwordEncoder;
        this.audit = audit;
        this.logs = logs;
    }

    @Transactional(readOnly = true)
    public OpsDtos.UserList listUsers(UserRole role, UserStatus status, Long facilityId,
                                      String search) {
        List<User> matched = users.search(role, status, facilityId,
                        PageRequest.of(0, Integer.MAX_VALUE)).getContent().stream()
                .filter(user -> matches(user, search))
                .toList();
        long total = matched.size();
        long active = matched.stream().filter(user -> user.getStatus() == UserStatus.ACTIVE).count();
        long disabled = total - active;
        long elevated = matched.stream().filter(user -> ELEVATED.contains(user.getRole())).count();
        List<OpsDtos.AdminUserDto> items = matched.stream().map(this::toAdminUser).toList();
        return new OpsDtos.UserList(items, new OpsDtos.UserSummary(total, active, disabled, elevated));
    }

    @Transactional
    public OpsDtos.AdminUserDto createUser(String fullName, String email, String phone,
                                          String password, UserRole role, Long facilityId) {
        String normalizedEmail = email.toLowerCase().trim();
        if (users.existsByEmail(normalizedEmail)) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        boolean facilityScoped = role == UserRole.FACILITY_STAFF || role == UserRole.FACILITY_MANAGER;
        if (facilityScoped && facilityId == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Vai trÃƒÂ² " + role + " bÃ¡ÂºÂ¯t buÃ¡Â»â„¢c phÃ¡ÂºÂ£i gÃƒÂ¡n cÃ†Â¡ sÃ¡Â»Å¸");
        }
        if (!facilityScoped && facilityId != null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Vai trÃƒÂ² " + role + " khÃƒÂ´ng Ã„â€˜Ã†Â°Ã¡Â»Â£c gÃƒÂ¡n cÃ†Â¡ sÃ¡Â»Å¸");
        }
        if (facilityId != null && !facilities.existsById(facilityId)) {
            throw new NotFoundException(ErrorCode.FACILITY_NOT_FOUND);
        }
        User user = new User();
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(
                password == null || password.isBlank() ? randomPassword() : password));
        user.setFullName(fullName.trim());
        user.setPhone(phone);
        user.setRole(role);
        user.setFacilityId(facilityId);
        user.setStatus(UserStatus.ACTIVE);
        User saved = users.save(user);
        audit.record(SecurityUtils.getCurrentUserId().orElse(null), "USER_CREATED", "USER",
                saved.getId(), Map.of("email", normalizedEmail, "role", role.name()));
        return toAdminUser(saved);
    }

    @Transactional
    public OpsDtos.AdminUserDto updateUser(Long userId, String fullName, String email, String phone,
                                           UserRole role, Long facilityId) {
        User user = userAdminService.requireById(userId);
        String normalizedEmail = email.toLowerCase().trim();
        if (!user.getEmail().equals(normalizedEmail) && users.existsByEmail(normalizedEmail)) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        boolean facilityScoped = role == UserRole.FACILITY_STAFF || role == UserRole.FACILITY_MANAGER;
        if (facilityScoped && facilityId == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Vai trÃƒÂ² " + role + " bÃ¡ÂºÂ¯t buÃ¡Â»â„¢c phÃ¡ÂºÂ£i gÃƒÂ¡n cÃ†Â¡ sÃ¡Â»Å¸");
        }
        if (!facilityScoped && facilityId != null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Vai trÃƒÂ² " + role + " khÃƒÂ´ng Ã„â€˜Ã†Â°Ã¡Â»Â£c gÃƒÂ¡n cÃ†Â¡ sÃ¡Â»Å¸");
        }
        if (facilityId != null && !facilities.existsById(facilityId)) {
            throw new NotFoundException(ErrorCode.FACILITY_NOT_FOUND);
        }
        if (user.getRole() == UserRole.ADMIN && role != UserRole.ADMIN
                && user.getStatus() == UserStatus.ACTIVE && activeAdminCount() <= 1) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "KhÃƒÂ´ng thÃ¡Â»Æ’ hÃ¡ÂºÂ¡ vai trÃƒÂ² quÃ¡ÂºÂ£n trÃ¡Â»â€¹ viÃƒÂªn hoÃ¡ÂºÂ¡t Ã„â€˜Ã¡Â»â„¢ng cuÃ¡Â»â€˜i cÃƒÂ¹ng");
        }
        user.setEmail(normalizedEmail);
        user.setFullName(fullName.trim());
        user.setPhone(phone);
        user.setRole(role);
        user.setFacilityId(facilityId);
        audit.record(SecurityUtils.getCurrentUserId().orElse(null), "USER_UPDATED", "USER",
                user.getId(), Map.of("email", normalizedEmail, "role", role.name()));
        return toAdminUser(user);
    }

    @Transactional
    public OpsDtos.AdminUserDto updateUserStatus(Long userId, UserStatus status) {
        return toAdminUser(userAdminService.updateStatus(userId, status));
    }
    @Transactional(readOnly = true)
    public List<OpsDtos.ActivityLogDto> activityLogs(String action, String search) {
        List<ActivityLog> matched = logs.search(null, action, PageRequest.of(0, LOG_LIMIT))
                .getContent().stream()
                .filter(log -> matchesActor(log, search))
                .toList();
        Map<Long, User> actors = Map.of();
        List<Long> actorIds = matched.stream().map(ActivityLog::getUserId).distinct().toList();
        if (!actorIds.isEmpty()) {
            actors = Map.copyOf(users.findAllById(actorIds).stream()
                    .collect(java.util.stream.Collectors.toMap(User::getId, user -> user)));
        }
        Map<Long, User> lookup = actors;
        return matched.stream()
                .map(log -> new OpsDtos.ActivityLogDto(log.getId(),
                        log.getUserId() == null ? null
                                : lookup.get(log.getUserId()).getFullName(),
                        log.getAction(), log.getEntityType(), log.getEntityId(),
                        detailOf(log), log.getIpAddress(), log.getCreatedAt()))
                .toList();
    }

    private long activeAdminCount() {
        return users.search(UserRole.ADMIN, UserStatus.ACTIVE, null,
                PageRequest.of(0, Integer.MAX_VALUE)).getTotalElements();
    }

    private static boolean matches(User user, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }
        String needle = search.trim().toLowerCase(java.util.Locale.ROOT);
        return user.getFullName().toLowerCase(java.util.Locale.ROOT).contains(needle)
                || user.getEmail().toLowerCase(java.util.Locale.ROOT).contains(needle);
    }

    private boolean matchesActor(ActivityLog log, String search) {
        if (isBlank(search)) {
            return true;
        }
        if (log.getUserId() == null) {
            return true;
        }
        String needle = search.trim().toLowerCase(java.util.Locale.ROOT);
        return users.findById(log.getUserId())
                .map(user -> containsIgnoreCase(user.getFullName(), needle)
                        || containsIgnoreCase(user.getEmail(), needle))
                .orElse(true);
    }

    private static boolean containsIgnoreCase(String value, String needle) {
        return value != null && value.toLowerCase(java.util.Locale.ROOT).contains(needle);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static String detailOf(ActivityLog log) {
        return log.getAction();
    }

    private OpsDtos.AdminUserDto toAdminUser(UserDto user) {
        // UserDto has no createdAt; reload to fill the FE2 form.
        return toAdminUser(users.findById(user.id())
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND)));
    }

    private OpsDtos.AdminUserDto toAdminUser(User user) {
        return new OpsDtos.AdminUserDto(user.getId(), user.getEmail(), user.getFullName(),
                user.getPhone(), user.getRole().name(), user.getFacilityId(),
                user.getStatus().name(), user.getCreatedAt());
    }

    private static String randomPassword() {
        byte[] bytes = new byte[24];
        new java.security.SecureRandom().nextBytes(bytes);
        return java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
