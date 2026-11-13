package com.storage.management.service;

import com.storage.account.repository.UserRepository;
import com.storage.facility.repository.FacilityRepository;
import com.storage.facility.repository.StorageUnitRepository;
import com.storage.management.dto.ManagementDtos.FeeTypeCreateRequest;
import com.storage.management.dto.ManagementDtos.FeeTypeResponse;
import com.storage.payment.entity.FeeType;
import com.storage.payment.repository.BusinessPolicyRepository;
import com.storage.payment.repository.FeeTypeRepository;
import com.storage.rental.repository.RentalRepository;
import com.storage.shared.exception.BusinessException;
import com.storage.shared.service.Analytics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ManagementOpsServiceTest {

    @Mock private BusinessPolicyService policyService;
    @Mock private BusinessPolicyRepository policies;
    @Mock private FeeTypeRepository feeTypes;
    @Mock private FacilityRepository facilities;
    @Mock private StorageUnitRepository units;
    @Mock private RentalRepository rentals;
    @Mock private UserRepository users;
    @Mock private Analytics analytics;

    private ManagementOpsService service;

    @BeforeEach
    void setUp() {
        service = new ManagementOpsService(policyService, policies, feeTypes, facilities, units,
                rentals, users, analytics);
    }

    @Test
    void createFeeTypeSavesNormalizedFeeWhenCodeIsNew() {
        when(feeTypes.existsByCode("CLEANING")).thenReturn(false);
        when(feeTypes.save(any(FeeType.class))).thenAnswer(invocation -> {
            FeeType saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 15L);
            return saved;
        });

        FeeTypeResponse dto = service.createFeeType(
                new FeeTypeCreateRequest(" cleaning ", "Vệ sinh kho", new BigDecimal("150000"), true));

        assertThat(dto.id()).isEqualTo(15L);
        assertThat(dto.code()).isEqualTo("CLEANING");
        assertThat(dto.name()).isEqualTo("Vệ sinh kho");
        assertThat(dto.defaultAmount()).isEqualByComparingTo("150000");
        assertThat(dto.active()).isTrue();
    }

    @Test
    void createFeeTypeRejectsDuplicateCode() {
        when(feeTypes.existsByCode("LOST_KEY")).thenReturn(true);

        assertThatThrownBy(() -> service.createFeeType(
                new FeeTypeCreateRequest("lost_key", "Mất chìa", new BigDecimal("200000"), true)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Mã phụ phí");

        verify(feeTypes, never()).save(any());
    }
}
