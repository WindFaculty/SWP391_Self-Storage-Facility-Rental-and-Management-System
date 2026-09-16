package com.storage.facility.service;

import com.storage.facility.domain.enums.UnitStatus;
import com.storage.shared.exception.BusinessException;
import com.storage.shared.exception.ErrorCode;
import java.util.*;

public final class UnitStatusTransitionValidator {
    private static final Map<UnitStatus, Set<UnitStatus>> ALLOWED = Map.of(
            UnitStatus.AVAILABLE, EnumSet.of(UnitStatus.RESERVED, UnitStatus.MAINTENANCE, UnitStatus.UNAVAILABLE),
            UnitStatus.RESERVED, EnumSet.of(UnitStatus.AVAILABLE, UnitStatus.OCCUPIED, UnitStatus.MAINTENANCE),
            UnitStatus.OCCUPIED, EnumSet.of(UnitStatus.INSPECTION),
            UnitStatus.INSPECTION, EnumSet.of(UnitStatus.AVAILABLE, UnitStatus.MAINTENANCE),
            UnitStatus.MAINTENANCE, EnumSet.of(UnitStatus.INSPECTION, UnitStatus.AVAILABLE, UnitStatus.UNAVAILABLE),
            UnitStatus.UNAVAILABLE, EnumSet.of(UnitStatus.MAINTENANCE)
    );
    private UnitStatusTransitionValidator() { }
    public static void validate(UnitStatus from, UnitStatus to) {
        if (from == to || !ALLOWED.getOrDefault(from, Set.of()).contains(to)) {
            throw new BusinessException(ErrorCode.INVALID_UNIT_STATUS_TRANSITION,
                    "Không thể chuyển trạng thái kho từ " + from + " sang " + to);
        }
    }
}
