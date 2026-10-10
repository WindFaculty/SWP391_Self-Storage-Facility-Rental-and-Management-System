package com.storage.management.service;

import com.storage.payment.entity.BusinessPolicy;
import com.storage.payment.repository.BusinessPolicyRepository;
import java.math.BigDecimal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BusinessPolicyService {

    private static final short POLICY_ID = 1;

    private final BusinessPolicyRepository businessPolicyRepository;

    public BusinessPolicyService(BusinessPolicyRepository businessPolicyRepository) {
        this.businessPolicyRepository = businessPolicyRepository;
    }

    @Transactional(readOnly = true)
    public BusinessPolicy current() {
        return businessPolicyRepository.findById(POLICY_ID)
                .orElseThrow(() -> new IllegalStateException("business policy is not configured"));
    }

    @Transactional
    public BusinessPolicy setPolicy(BigDecimal depositPercent, Integer renewalNoticeDays,
                                    BigDecimal cancellationFee, Integer returnNoticeDays,
                                    Integer overdueGraceDays, BigDecimal overdueFeePerDay,
                                    BigDecimal maxDiscountPercent, Long updatedByUserId) {
        if (updatedByUserId == null) {
            throw new IllegalArgumentException("updatedByUserId is required");
        }
        BusinessPolicy policy = businessPolicyRepository.findById(POLICY_ID)
                .orElseGet(BusinessPolicy::initial);
        policy.update(depositPercent, renewalNoticeDays, cancellationFee, returnNoticeDays,
                overdueGraceDays, overdueFeePerDay, maxDiscountPercent, updatedByUserId);
        return businessPolicyRepository.save(policy);
    }
}
