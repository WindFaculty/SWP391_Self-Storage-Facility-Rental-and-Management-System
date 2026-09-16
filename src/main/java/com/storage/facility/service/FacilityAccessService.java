package com.storage.facility.service;

import com.storage.account.entity.UserRole;
import com.storage.shared.exception.ForbiddenException;
import com.storage.shared.security.SecurityUtils;
import com.storage.shared.security.UserPrincipal;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class FacilityAccessService {
    public void requireBusinessManager() {
        UserPrincipal principal = currentUser();
        if (!hasRole(principal, UserRole.ADMIN) && !hasRole(principal, UserRole.BUSINESS_MANAGER)) {
            throw new ForbiddenException("Chỉ Business Manager hoặc Admin được thực hiện thao tác này");
        }
    }

    public void requireFacilityAccess(UUID facilityId) {
        UserPrincipal principal = currentUser();
        if (hasRole(principal, UserRole.ADMIN) || hasRole(principal, UserRole.BUSINESS_MANAGER)) return;
        if (hasRole(principal, UserRole.FACILITY_MANAGER) && facilityId.equals(principal.getAssignedFacilityId())) return;
        throw new ForbiddenException("Bạn không có quyền quản lý cơ sở kho này");
    }

    private UserPrincipal currentUser() {
        return SecurityUtils.getCurrentUserPrincipal().orElseThrow(() -> new ForbiddenException("Bạn cần đăng nhập để thực hiện thao tác này"));
    }

    private boolean hasRole(UserPrincipal principal, UserRole role) {
        return principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_" + role.name()));
    }
}
