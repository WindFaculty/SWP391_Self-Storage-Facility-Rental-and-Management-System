package com.storage.facility.repository;

import com.storage.facility.entity.StorageUnit;
import com.storage.facility.entity.StorageUnitStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StorageUnitRepository extends JpaRepository<StorageUnit, Long> {

    boolean existsByFacilityIdAndUnitCode(Long facilityId, String unitCode);

    @Query("""
            select u from StorageUnit u
            where u.facility.id = :facilityId
              and (:status is null or u.status = :status)
              and (:unitTypeId is null or u.unitType.id = :unitTypeId)
            """)
    Page<StorageUnit> search(@Param("facilityId") Long facilityId,
                             @Param("status") StorageUnitStatus status,
                             @Param("unitTypeId") Long unitTypeId,
                             Pageable pageable);
}
