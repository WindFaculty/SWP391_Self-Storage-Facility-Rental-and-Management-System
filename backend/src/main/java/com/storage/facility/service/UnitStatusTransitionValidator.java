package com.storage.facility.service;

import com.storage.facility.entity.StorageUnitStatus;
import com.storage.shared.exception.BusinessException;
import com.storage.shared.exception.ErrorCode;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/*
 * Physical state machine of a storage unit (plan section 7.1): a returned unit
 * goes through INSPECTION and only returns to AVAILABLE after passing;
 * OCCUPIED is entered on handover and left on return.
 */
public final class UnitStatusTransitionValidator {

    private static final Map<StorageUnitStatus, Set<StorageUnitStatus>> ALLOWED = Map.of(
            StorageUnitStatus.AVAILABLE, EnumSet.of(StorageUnitStatus.OCCUPIED, StorageUnitStatus.MAINTENANCE),
            StorageUnitStatus.OCCUPIED, EnumSet.of(StorageUnitStatus.INSPECTION),
            StorageUnitStatus.INSPECTION, EnumSet.of(StorageUnitStatus.AVAILABLE, StorageUnitStatus.MAINTENANCE),
            StorageUnitStatus.MAINTENANCE, EnumSet.of(StorageUnitStatus.AVAILABLE)
    );

    private UnitStatusTransitionValidator() {
    }

    public static void validate(StorageUnitStatus from, StorageUnitStatus to) {
        if (from == to || !ALLOWED.getOrDefault(from, Set.of()).contains(to)) {
            throw new BusinessException(ErrorCode.INVALID_UNIT_STATUS_TRANSITION,
                    "Không thể chuyển trạng thái kho từ " + from + " sang " + to);
        }
    }
}
