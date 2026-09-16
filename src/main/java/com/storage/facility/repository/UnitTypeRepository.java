package com.storage.facility.repository;
import com.storage.facility.domain.entity.UnitType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface UnitTypeRepository extends JpaRepository<UnitType, UUID> { boolean existsByCode(String code); }
