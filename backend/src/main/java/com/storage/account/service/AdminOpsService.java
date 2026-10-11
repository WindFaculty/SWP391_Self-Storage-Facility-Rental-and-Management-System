package com.storage.account.service;

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
import com.storage.shared.text.Strings;
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
        requireFacilityScope(role, facilityId);
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
        requireFacilityScope(role, facilityId);
        if (user.getRole() == UserRole.ADMIN && role != UserRole.ADMIN
                && user.getStatus() == UserStatus.ACTIVE && activeAdminCount() <= 1) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Không thể hạ vai trò quản trị viên cuối cùng");
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
        List<ActivityLog> page = logs.search(null, action, PageRequest.of(0, LOG_LIMIT)).getContent();
        Map<Long, User> actors = actorsOf(page);
        return page.stream()
                .filter(log -> matchesActor(actors, log, search))
                .map(log -> new OpsDtos.ActivityLogDto(log.getId(),
                        log.getUserId() == null ? null
                                : actors.get(log.getUserId()).getFullName(),
                        log.getAction(), log.getEntityType(), log.getEntityId(),
                        log.getAction(), log.getIpAddress(), log.getCreatedAt()))
                .toList();
    }

    private long activeAdminCount() {
        return users.search(UserRole.ADMIN, UserStatus.ACTIVE, null,
                PageRequest.of(0, Integer.MAX_VALUE)).getTotalElements();
    }

    private static boolean matches(User user, String search) {
        if (Strings.isBlank(search)) {
            return true;
        }
        String needle = search.trim().toLowerCase(java.util.Locale.ROOT);
        return Strings.containsIgnoreCase(user.getFullName(), needle)
                || Strings.containsIgnoreCase(user.getEmail(), needle);
    }

    private Map<Long, User> actorsOf(List<ActivityLog> logs) {
        List<Long> ids = logs.stream().map(ActivityLog::getUserId).distinct()
                .filter(java.util.Objects::nonNull).toList();
        return ids.isEmpty() ? Map.of()
                : users.findAllById(ids).stream()
                        .collect(java.util.stream.Collectors.toMap(User::getId, user -> user));
    }

    private static boolean matchesActor(Map<Long, User> actors, ActivityLog log, String search) {
        if (Strings.isBlank(search)) {
            return true;
        }
        User actor = log.getUserId() == null ? null : actors.get(log.getUserId());
        if (actor == null) {
            return true;
        }
        return Strings.containsIgnoreCase(actor.getFullName(), search)
                || Strings.containsIgnoreCase(actor.getEmail(), search);
    }

    private void requireFacilityScope(UserRole role, Long facilityId) {
        boolean facilityScoped = role == UserRole.FACILITY_STAFF || role == UserRole.FACILITY_MANAGER;
        if (facilityScoped && facilityId == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Vai trò " + role + " bắt buộc phải gắn cơ sở");
        }
        if (!facilityScoped && facilityId != null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Vai trò " + role + " không được gắn cơ sở");
        }
        if (facilityId != null && !facilities.existsById(facilityId)) {
            throw new NotFoundException(ErrorCode.FACILITY_NOT_FOUND);
        }
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
