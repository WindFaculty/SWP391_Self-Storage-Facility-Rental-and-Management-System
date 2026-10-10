package com.storage.facility.repository;

import com.storage.facility.entity.UnitType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UnitTypeRepository extends JpaRepository<UnitType, Long> {

    boolean existsByName(String name);
}
