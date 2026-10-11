package com.storage.payment.repository;

import com.storage.payment.entity.FeeType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeeTypeRepository extends JpaRepository<FeeType, Long> {
}
