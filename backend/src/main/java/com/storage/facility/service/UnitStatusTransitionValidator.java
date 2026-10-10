package com.storage.facility.service;

import com.storage.facility.entity.StorageUnitStatus;
import com.storage.shared.exception.BusinessException;
import com.storage.shared.exception.ErrorCode;

public final class UnitStatusTransitionValidator {

    private UnitStatusTransitionValidator() {
    }

    public static void validate(StorageUnitStatus from, StorageUnitStatus to) {
        if (!from.canTransitionTo(to)) {
            throw new BusinessException(ErrorCode.INVALID_UNIT_STATUS_TRANSITION,
                    "Không thể chuyển trạng thái kho từ " + from + " sang " + to);
        }
    }
}
