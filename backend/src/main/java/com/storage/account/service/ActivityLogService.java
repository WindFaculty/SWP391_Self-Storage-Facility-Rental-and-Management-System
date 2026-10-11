package com.storage.account.service;

import com.storage.account.entity.ActivityLog;
import com.storage.account.entity.User;
import com.storage.account.entity.UserStatus;
import com.storage.account.repository.ActivityLogRepository;
import com.storage.account.repository.UserRepository;
import com.storage.shared.exception.BusinessException;
import com.storage.shared.exception.ErrorCode;
import com.storage.shared.exception.NotFoundException;
import com.storage.shared.security.SecurityUtils;
import com.storage.shared.web.ClientIp;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class ActivityLogService {

    private final ActivityLogRepository logs;

    public ActivityLogService(ActivityLogRepository logs) {
        this.logs = logs;
    }

    /*
     * Joins the caller's transaction so the audit row commits atomically with
     * the action (and can reference rows the caller has just inserted).
     */
    @Transactional(propagation = Propagation.REQUIRED)
    public void record(Long userId, String action, String entityType, Long entityId,
                       Map<String, Object> metadata) {
        logs.save(entry(userId, action, entityType, entityId, metadata));
    }

    /*
     * Own transaction for events whose caller will roll back, e.g. LOGIN_FAILED.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordStandalone(Long userId, String action, String entityType, Long entityId,
                                 Map<String, Object> metadata) {
        logs.save(entry(userId, action, entityType, entityId, metadata));
    }

    private ActivityLog entry(Long userId, String action, String entityType, Long entityId,
                              Map<String, Object> metadata) {
        ActivityLog entry = new ActivityLog();
        entry.setUserId(userId);
        entry.setAction(action);
        entry.setEntityType(entityType);
        entry.setEntityId(entityId);
        entry.setIpAddress(ClientIp.current());
        entry.setMetadata(metadata);
        return entry;
    }
}
