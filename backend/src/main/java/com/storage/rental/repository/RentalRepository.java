package com.storage.rental.repository;

import com.storage.rental.entity.Rental;
import com.storage.rental.entity.RentalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

import java.time.Instant;

public interface RentalRepository extends JpaRepository<Rental, Long> {

    List<Rental> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Rental> findByStatusAndPaymentExpiresAtBefore(RentalStatus status, Instant expiry);

    Optional<Rental> findByIdAndCustomerId(Long id, Long customerId);

    List<Rental> findByUnitIdAndStatusIn(Long unitId, List<RentalStatus> statuses);

    /*
     * Availability-blocking rentals of one unit; the caller holds the unit row
     * lock (StorageUnitRepository.findWithLockById) while checking overlap.
     */
    @Query("""
            select r from Rental r
            where r.unitId = :unitId
              and r.status in :blocking
            """)
    List<Rental> findBlockingRentals(@Param("unitId") Long unitId,
                                     @Param("blocking") List<RentalStatus> blocking);

    @Query("""
            select r from Rental r
            where r.unitId in (select u.id from com.storage.facility.entity.StorageUnit u
                               where u.facility.id = :facilityId)
            """)
    List<Rental> findByFacilityId(@Param("facilityId") Long facilityId);

    @Query("""
            select r from Rental r
            where r.unitId in (select u.id from com.storage.facility.entity.StorageUnit u
                               where u.facility.id in :facilityIds)
            """)
    List<Rental> findByFacilityIdIn(@Param("facilityIds") List<Long> facilityIds);

    @Query("""
            select r.status as status, count(r) as rentalCount
            from Rental r
            where r.unitId in :unitIds
            group by r.status
            """)
    List<RentalStatusCount> countByStatusForUnits(@Param("unitIds") List<Long> unitIds);

    interface RentalStatusCount {
        RentalStatus getStatus();

        long getRentalCount();
    }
}
