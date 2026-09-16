package com.storage.facility.repository;

import com.storage.facility.domain.entity.StorageUnit;
import com.storage.facility.domain.enums.UnitStatus;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;

public interface StorageUnitRepository extends JpaRepository<StorageUnit, UUID> {
    @Query("select u from StorageUnit u where u.facility.id = :facilityId and (:status is null or u.status = :status) and (:unitTypeId is null or u.unitType.id = :unitTypeId)")
    Page<StorageUnit> search(@Param("facilityId") UUID facilityId, @Param("status") UnitStatus status, @Param("unitTypeId") UUID unitTypeId, Pageable pageable);
    long countByFacility_IdAndStatus(UUID facilityId, UnitStatus status);
    boolean existsByFacility_IdAndCode(UUID facilityId, String code);
}
