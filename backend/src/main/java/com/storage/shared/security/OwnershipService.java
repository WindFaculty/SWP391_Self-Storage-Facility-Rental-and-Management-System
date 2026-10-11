package com.storage.shared.security;

import com.storage.shared.exception.ForbiddenException;
import org.springframework.stereotype.Service;

/*
 * Object-ownership guard for customer-owned resources: only the owner may read
 * or mutate them. Facility staff access is granted separately through
 * FacilityAccessService, never through ownership. Usable in SpEL as @ownership.
 */
@Service("ownership")
public class OwnershipService {

    public boolean isOwner(Long ownerId) {
        return SecurityUtils.getCurrentUserId()
                .map(currentId -> currentId.equals(ownerId))
                .orElse(false);
    }

    public void requireOwnership(Long ownerId) {
        if (!isOwner(ownerId)) {
            throw new ForbiddenException("Bạn không có quyền truy cập tài nguyên của người khác");
        }
    }
}
