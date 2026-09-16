package com.storage.facility;

import com.storage.facility.domain.enums.UnitStatus;
import com.storage.facility.service.UnitStatusTransitionValidator;
import com.storage.shared.exception.BusinessException;
import com.storage.shared.exception.ErrorCode;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class UnitStatusTransitionValidatorTest {
    @Test
    void allowsReservationAndInspectionLifecycle() {
        assertDoesNotThrow(() -> UnitStatusTransitionValidator.validate(UnitStatus.AVAILABLE, UnitStatus.RESERVED));
        assertDoesNotThrow(() -> UnitStatusTransitionValidator.validate(UnitStatus.RESERVED, UnitStatus.OCCUPIED));
        assertDoesNotThrow(() -> UnitStatusTransitionValidator.validate(UnitStatus.OCCUPIED, UnitStatus.INSPECTION));
        assertDoesNotThrow(() -> UnitStatusTransitionValidator.validate(UnitStatus.INSPECTION, UnitStatus.AVAILABLE));
    }

    @Test
    void preventsOccupiedUnitFromBecomingAvailableWithoutInspection() {
        BusinessException exception = assertThrows(BusinessException.class,
                () -> UnitStatusTransitionValidator.validate(UnitStatus.OCCUPIED, UnitStatus.AVAILABLE));
        assertEquals(ErrorCode.INVALID_UNIT_STATUS_TRANSITION, exception.getErrorCode());
    }
}
