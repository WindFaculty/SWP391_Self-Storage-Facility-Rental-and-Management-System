package com.storage.management.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.storage.payment.entity.BusinessPolicy;
import com.storage.payment.repository.BusinessPolicyRepository;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BusinessPolicyServiceTest {

    @Mock
    private BusinessPolicyRepository businessPolicyRepository;

    private BusinessPolicyService businessPolicyService;

    @BeforeEach
    void setUp() {
        businessPolicyService = new BusinessPolicyService(businessPolicyRepository);
    }

    private static void update(BusinessPolicyService service, String depositPercent,
                               String maxDiscountPercent) {
        service.setPolicy(new BigDecimal(depositPercent), 7, new BigDecimal("50000.00"), 3, 5,
                new BigDecimal("20000.00"), new BigDecimal(maxDiscountPercent), 9L);
    }

    @Test
    void createsPolicyWhenNotConfigured() {
        when(businessPolicyRepository.findById((short) 1)).thenReturn(Optional.empty());
        when(businessPolicyRepository.save(any(BusinessPolicy.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        BusinessPolicy policy = businessPolicyService.setPolicy(new BigDecimal("20.00"), 7,
                new BigDecimal("50000.00"), 3, 5, new BigDecimal("20000.00"),
                new BigDecimal("10.00"), 9L);

        assertEquals(new BigDecimal("20.00"), policy.getDepositPercent());
        assertEquals(9L, policy.getUpdatedByUserId());
        assertNotNull(policy.getUpdatedAt());
    }

    @Test
    void updatesExistingPolicy() {
        BusinessPolicy policy = BusinessPolicy.initial();
        update(businessPolicyServiceWithExisting(policy), "10.00", "5.00");
        update(businessPolicyServiceWithExisting(policy), "25.00", "15.00");

        assertEquals(new BigDecimal("25.00"), policy.getDepositPercent());
        assertEquals(new BigDecimal("15.00"), policy.getMaxDiscountPercent());
    }

    private BusinessPolicyService businessPolicyServiceWithExisting(BusinessPolicy policy) {
        when(businessPolicyRepository.findById((short) 1)).thenReturn(Optional.of(policy));
        when(businessPolicyRepository.save(any(BusinessPolicy.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        return businessPolicyService;
    }

    @Test
    void rejectsMissingActor() {
        assertThrows(IllegalArgumentException.class, () -> businessPolicyService.setPolicy(
                new BigDecimal("20.00"), 7, new BigDecimal("50000.00"), 3, 5,
                new BigDecimal("20000.00"), new BigDecimal("10.00"), null));
    }

    @Test
    void rejectsOutOfRangePercent() {
        assertThrows(IllegalArgumentException.class,
                () -> update(businessPolicyService, "101.00", "10.00"));
        assertThrows(IllegalArgumentException.class,
                () -> update(businessPolicyService, "-1.00", "10.00"));
        assertThrows(IllegalArgumentException.class,
                () -> update(businessPolicyService, "20.00", "100.01"));
    }

    @Test
    void rejectsNegativeFeesAndDays() {
        assertThrows(IllegalArgumentException.class, () -> businessPolicyService.setPolicy(
                new BigDecimal("20.00"), -1, new BigDecimal("50000.00"), 3, 5,
                new BigDecimal("20000.00"), new BigDecimal("10.00"), 9L));
        assertThrows(IllegalArgumentException.class, () -> businessPolicyService.setPolicy(
                new BigDecimal("20.00"), 7, new BigDecimal("-0.01"), 3, 5,
                new BigDecimal("20000.00"), new BigDecimal("10.00"), 9L));
    }
}
