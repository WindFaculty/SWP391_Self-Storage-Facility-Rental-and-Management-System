package com.storage.account.service;

import com.storage.account.dto.AdminDtos.ActivityLogResponse;
import com.storage.account.entity.ActivityLog;
import com.storage.account.repository.ActivityLogRepository;
import com.storage.shared.response.PageResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

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
        entry.setIpAddress(currentIpAddress());
        entry.setMetadata(metadata);
        return entry;
    }

    @Transactional(readOnly = true)
    public PageResponse<ActivityLogResponse> list(Long userId, String action, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
        return PageResponse.from(logs.search(userId, action, pageable).map(ActivityLogResponse::from));
    }

    private static String currentIpAddress() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes) {
            HttpServletRequest request = attributes.getRequest();
            String forwardedFor = request.getHeader("X-Forwarded-For");
            if (StringUtils.hasText(forwardedFor)) {
                return forwardedFor.split(",")[0].trim();
            }
            return request.getRemoteAddr();
        }
        return null;
    }
}
