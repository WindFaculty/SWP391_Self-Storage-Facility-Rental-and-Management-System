package com.storage.rental.repository;

import com.storage.rental.entity.Reservation;
import com.storage.rental.entity.ReservationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ReservationRepository extends JpaRepository<Reservation, UUID> {
    Page<Reservation> findByCustomerId(UUID customerId, Pageable pageable);

    // Dùng để kiểm tra số lượng unit còn trống khi tính availability (Phase 3).
    long countByFacilityIdAndUnitTypeIdAndStatusIn(UUID facilityId, UUID unitTypeId, java.util.List<ReservationStatus> statuses);
}
