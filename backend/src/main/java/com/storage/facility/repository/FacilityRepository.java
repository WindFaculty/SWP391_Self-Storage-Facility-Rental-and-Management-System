package com.storage.facility.repository;

import com.storage.facility.entity.Facility;
import com.storage.facility.entity.FacilityStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FacilityRepository extends JpaRepository<Facility, Long> {

    List<Facility> findByStatusOrderByNameAsc(FacilityStatus status);

    boolean existsByCode(String code);
}
