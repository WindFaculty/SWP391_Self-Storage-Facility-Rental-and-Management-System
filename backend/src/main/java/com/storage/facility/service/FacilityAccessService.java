package com.storage.facility.service;

import com.storage.shared.exception.ForbiddenException;
import com.storage.shared.security.SecurityUtils;
import com.storage.shared.security.UserPrincipal;
import org.springframework.stereotype.Service;

/*
 * Facility-scope guard (plan section 7.3): ADMIN and BUSINESS_MANAGER are
 * system-wide; FACILITY_MANAGER/FACILITY_STAFF only their assigned facility
 * (single assignment in MVP, decision D07). Usable in SpEL as @facilityAccess.
 */
@Service("facilityAccess")
public class FacilityAccessService {

    public boolean canAccessFacility(Long facilityId) {
        return SecurityUtils.getCurrentUserPrincipal()
                .map(principal -> canAccess(principal, facilityId))
                .orElse(false);
    }

    public void requireFacilityAccess(Long facilityId) {
        UserPrincipal principal = SecurityUtils.getCurrentUserPrincipal()
                .orElseThrow(() -> new ForbiddenException("Bạn cần đăng nhập để thực hiện thao tác này"));
        if (!canAccess(principal, facilityId)) {
            throw new ForbiddenException("Bạn không có quyền truy cập cơ sở kho này");
        }
    }

    private boolean canAccess(UserPrincipal principal, Long facilityId) {
        return switch (principal.getRole()) {
            case ADMIN, BUSINESS_MANAGER -> true;
            case FACILITY_MANAGER, FACILITY_STAFF ->
                    facilityId != null && facilityId.equals(principal.getFacilityId());
            case CUSTOMER -> false;
        };
    }
}
