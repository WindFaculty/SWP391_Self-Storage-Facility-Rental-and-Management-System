package com.storage.account.service;

import com.storage.account.entity.User;
import com.storage.account.entity.UserStatus;
import com.storage.account.repository.UserRepository;
import com.storage.shared.exception.BusinessException;
import com.storage.shared.exception.ErrorCode;
import com.storage.shared.exception.NotFoundException;
import com.storage.shared.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * Status changes shared by the admin workspace; the rest of user management
 * lives in AdminOpsService.
 */
@Service
public class UserAdminService {

    private final UserRepository users;
    private final ActivityLogService audit;

    public UserAdminService(UserRepository users, ActivityLogService audit) {
        this.users = users;
        this.audit = audit;
    }

    @Transactional
    public User updateStatus(Long userId, UserStatus status) {
        User user = user(userId);
        if (status == UserStatus.DISABLED
                && user.getId().equals(SecurityUtils.getCurrentUserId().orElse(null))) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Không thể vô hiệu hóa tài khoản của chính mình");
        }
        user.setStatus(status);
        audit.record(SecurityUtils.getCurrentUserId().orElse(null), "ADMIN_UPDATE_USER_STATUS", "USER", user.getId(),
                Map.<String, Object>of("status", status.name()));
        return user;
    }

    public User requireById(Long userId) {
        return user(userId);
    }

    private User user(Long userId) {
        return users.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));
    }
}
