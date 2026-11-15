package com.storage.management.service;

import com.storage.account.repository.UserRepository;
import com.storage.facility.entity.Facility;
import com.storage.facility.entity.UnitType;
import com.storage.facility.repository.FacilityRepository;
import com.storage.facility.repository.StorageUnitRepository;
import com.storage.facility.repository.UnitTypeRepository;
import com.storage.management.dto.ManagementDtos.FacilityInputRequest;
import com.storage.management.dto.ManagementDtos.FacilityOverviewResponse;
import com.storage.management.dto.ManagementDtos.FeeTypeCreateRequest;
import com.storage.management.dto.ManagementDtos.FeeTypeResponse;
import com.storage.management.dto.ManagementDtos.UnitTypeInputRequest;
import com.storage.management.dto.ManagementDtos.UnitTypeResponse;
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
import java.util.Optional;

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
    @Mock private UnitTypeRepository unitTypes;
    @Mock private FacilityRepository facilities;
    @Mock private StorageUnitRepository units;
    @Mock private RentalRepository rentals;
    @Mock private UserRepository users;
    @Mock private Analytics analytics;

    private ManagementOpsService service;

    @BeforeEach
    void setUp() {
        service = new ManagementOpsService(policyService, policies, feeTypes, unitTypes,
                facilities, units, rentals, users, analytics);
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

    @Test
    void createUnitTypeSavesValidUnitType() {
        when(unitTypes.existsByName("Standard (10 m2)")).thenReturn(false);
        when(unitTypes.save(any(UnitType.class))).thenAnswer(invocation -> {
            UnitType saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 8L);
            return saved;
        });

        UnitTypeResponse dto = service.createUnitType(new UnitTypeInputRequest(
                " Standard (10 m2) ",
                new BigDecimal("10.00"),
                new BigDecimal("1000000"),
                new BigDecimal("1500000"),
                " Kho tiêu chuẩn ",
                " /images/unit-types/medium.jpg "));

        assertThat(dto.id()).isEqualTo(8L);
        assertThat(dto.name()).isEqualTo("Standard (10 m2)");
        assertThat(dto.sizeM2()).isEqualByComparingTo("10.00");
        assertThat(dto.minMonthlyPrice()).isEqualByComparingTo("1000000");
        assertThat(dto.maxMonthlyPrice()).isEqualByComparingTo("1500000");
        assertThat(dto.description()).isEqualTo("Kho tiêu chuẩn");
        assertThat(dto.imageUrl()).isEqualTo("/images/unit-types/medium.jpg");
    }

    @Test
    void createUnitTypeRejectsDuplicateName() {
        when(unitTypes.existsByName("Small")).thenReturn(true);

        assertThatThrownBy(() -> service.createUnitType(new UnitTypeInputRequest(
                "Small", new BigDecimal("5"), new BigDecimal("500000"), new BigDecimal("800000"), null)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Tên loại kho");

        verify(unitTypes, never()).save(any());
    }

    @Test
    void createUnitTypeRejectsMaxPriceBelowMinPrice() {
        when(unitTypes.existsByName("Custom")).thenReturn(false);

        assertThatThrownBy(() -> service.createUnitType(new UnitTypeInputRequest(
                "Custom", new BigDecimal("6"), new BigDecimal("900000"), new BigDecimal("800000"), null)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Giá trần");

        verify(unitTypes, never()).save(any());
    }

    @Test
    void updateUnitTypeUpdatesFieldsAndAllowsKeepingSameName() {
        UnitType existing = new UnitType();
        ReflectionTestUtils.setField(existing, "id", 3L);
        existing.setName("Demo Small (5 m2)");
        existing.setSizeM2(new BigDecimal("5"));
        existing.setMinMonthlyPrice(new BigDecimal("500000"));
        existing.setMaxMonthlyPrice(new BigDecimal("800000"));
        existing.setDescription("Cũ");
        when(unitTypes.findById(3L)).thenReturn(Optional.of(existing));

        UnitTypeResponse updated = service.updateUnitType(3L, new UnitTypeInputRequest(
                "Demo Small (5 m2)",
                new BigDecimal("5.5"),
                new BigDecimal("600000"),
                new BigDecimal("900000"),
                "Mới",
                "https://cdn.example.com/small.png"));

        assertThat(updated.id()).isEqualTo(3L);
        assertThat(updated.sizeM2()).isEqualByComparingTo("5.5");
        assertThat(updated.minMonthlyPrice()).isEqualByComparingTo("600000");
        assertThat(updated.maxMonthlyPrice()).isEqualByComparingTo("900000");
        assertThat(updated.description()).isEqualTo("Mới");
        assertThat(updated.imageUrl()).isEqualTo("https://cdn.example.com/small.png");
        verify(unitTypes, never()).existsByName(any());
    }

    @Test
    void updateUnitTypeRejectsDuplicateNameFromAnotherType() {
        UnitType existing = new UnitType();
        ReflectionTestUtils.setField(existing, "id", 3L);
        existing.setName("Demo Small");
        when(unitTypes.findById(3L)).thenReturn(Optional.of(existing));
        when(unitTypes.existsByName("Demo Large")).thenReturn(true);

        assertThatThrownBy(() -> service.updateUnitType(3L, new UnitTypeInputRequest(
                "Demo Large", new BigDecimal("5"), new BigDecimal("500000"), new BigDecimal("800000"), null)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Tên loại kho");
    }

    @Test
    void createAndUpdateFacilityNormalizeImageUrl() {
        when(facilities.existsByCode("FAC-01")).thenReturn(false);
        when(facilities.save(any(Facility.class))).thenAnswer(invocation -> {
            Facility saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 10L);
            return saved;
        });

        FacilityOverviewResponse created = service.createFacility(new FacilityInputRequest(
                "FAC-01", "Cơ sở 1", "123 Đường A", " /images/facilities/hn-cau-giay.jpg "));

        assertThat(created.imageUrl()).isEqualTo("/images/facilities/hn-cau-giay.jpg");

        Facility existing = new Facility();
        ReflectionTestUtils.setField(existing, "id", 10L);
        existing.setCode("FAC-01");
        existing.setName("Cơ sở 1");
        existing.setAddress("123 Đường A");
        existing.setImageUrl("/images/facilities/hn-cau-giay.jpg");
        when(facilities.findById(10L)).thenReturn(Optional.of(existing));

        FacilityOverviewResponse cleared = service.updateFacility(10L, new FacilityInputRequest(
                "FAC-01", "Cơ sở 1", "123 Đường A", "   "));

        assertThat(cleared.imageUrl()).isNull();
    }

    @Test
    void createFacilityRejectsOverlongImageUrl() {
        when(facilities.existsByCode("FAC-02")).thenReturn(false);
        String overlong = "https://example.com/" + "a".repeat(500);

        assertThatThrownBy(() -> service.createFacility(new FacilityInputRequest(
                "FAC-02", "Cơ sở 2", "123 Đường B", overlong)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("500");

        verify(facilities, never()).save(any());
    }
}
