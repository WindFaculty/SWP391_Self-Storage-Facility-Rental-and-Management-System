package com.storage.payment.repository;

import com.storage.payment.entity.BusinessPolicy;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BusinessPolicyRepository extends JpaRepository<BusinessPolicy, Short> {
}
