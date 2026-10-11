package com.storage.facility.repository;

import com.storage.facility.entity.StorageUnit;
import com.storage.facility.entity.StorageUnitStatus;
import com.storage.rental.entity.RentalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface StorageUnitRepository extends JpaRepository<StorageUnit, Long> {

    boolean existsByFacilityIdAndUnitCode(Long facilityId, String unitCode);

    Optional<StorageUnit> findByFacilityIdAndUnitCode(Long facilityId, String unitCode);

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

    List<StorageUnit> findByFacilityId(Long facilityId);

    /*
     * Units of a unit type in a facility that are physically rentable for a
     * [start, end) window: the unit itself is not under inspection or
     * maintenance and no availability-blocking rental overlaps the window.
     */
    @Query("""
            select u from StorageUnit u
            where u.facility.id = :facilityId
              and u.unitType.id = :unitTypeId
              and u.status <> com.storage.facility.entity.StorageUnitStatus.INSPECTION
              and u.status <> com.storage.facility.entity.StorageUnitStatus.MAINTENANCE
              and not exists (
                  select r from com.storage.rental.entity.Rental r
                  where r.unitId = u.id
                    and r.status in :blocking
                    and r.startDate < :endDate
                    and r.endDate > :startDate
              )
            order by u.monthlyPrice asc, u.id asc
            """)
    List<StorageUnit> findFreeUnitsForHold(@Param("facilityId") Long facilityId,
                                           @Param("unitTypeId") Long unitTypeId,
                                           @Param("startDate") LocalDate startDate,
                                           @Param("endDate") LocalDate endDate,
                                           @Param("blocking") List<RentalStatus> blocking,
                                           Pageable pageable);

    /*
     * Same availability rule as above, counted per unit type, for the public
     * catalog "is there room in this period" badge.
     */
    @Query("""
            select u.unitType.id as unitTypeId, count(distinct u.id) as availableCount
            from StorageUnit u
            where u.facility.id = :facilityId
              and u.status <> com.storage.facility.entity.StorageUnitStatus.INSPECTION
              and u.status <> com.storage.facility.entity.StorageUnitStatus.MAINTENANCE
              and (:unitTypeId is null or u.unitType.id = :unitTypeId)
              and not exists (
                  select r from com.storage.rental.entity.Rental r
                  where r.unitId = u.id
                    and r.status in :blocking
                    and r.startDate < :endDate
                    and r.endDate > :startDate
              )
            group by u.unitType.id
            """)
    List<UnitTypeAvailability> countAvailableByFacility(@Param("facilityId") Long facilityId,
                                                        @Param("unitTypeId") Long unitTypeId,
                                                        @Param("startDate") LocalDate startDate,
                                                        @Param("endDate") LocalDate endDate,
                                                        @Param("blocking") List<RentalStatus> blocking);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from StorageUnit u where u.id = :id")
    Optional<StorageUnit> findWithLockById(@Param("id") Long id);

    @Query("""
            select u.unitType.id as unitTypeId, count(u) as totalCount
            from StorageUnit u
            where u.facility.id = :facilityId
              and (:unitTypeId is null or u.unitType.id = :unitTypeId)
            group by u.unitType.id
            """)
    List<UnitTotalCount> countTotalByFacility(@Param("facilityId") Long facilityId,
                                              @Param("unitTypeId") Long unitTypeId);

    interface UnitTypeAvailability {
        Long getUnitTypeId();

        long getAvailableCount();
    }

    interface UnitTotalCount {
        Long getUnitTypeId();

        long getTotalCount();
    }
}
