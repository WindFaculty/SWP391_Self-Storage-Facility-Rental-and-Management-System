package com.storage.facility.repository;

import com.storage.facility.domain.entity.Facility;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface FacilityRepository extends JpaRepository<Facility, UUID> {
    List<Facility> findByStatusOrderByNameAsc(com.storage.facility.domain.entity.FacilityStatus status);
}
